import {
  Installation,
  InstallationQuery,
  InstallationStore,
  Logger,
} from '@slack/oauth';
import { Mongoose, Model, Schema } from 'mongoose';
import MongooseInstallationStoreArgs from './MongooseInstallationStoreArgs';

export default class MongooseInstallationStore implements InstallationStore {
  private mongoose: Mongoose;

  private historicalDataEnabled: boolean;

  private clientId?: string;

  private schema: Schema;

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  private model: Model<any>;

  public constructor(options: MongooseInstallationStoreArgs) {
    this.mongoose = options.mongoose;
    this.historicalDataEnabled = options.historicalDataEnabled !== undefined ?
      options.historicalDataEnabled : true;
    this.clientId = options.clientId;

    this.schema = new this.mongoose.Schema(
      {
        // eslint-disable-next-line @typescript-eslint/naming-convention
        __appOrgWorkspace__: { type: String, index: true, unique: false },
        // eslint-disable-next-line @typescript-eslint/naming-convention
        __user__: { type: String, index: true, unique: false },
      },
      { strict: false, timestamps: { createdAt: 'db_record_created_at', updatedAt: 'db_record_updated_at' } },
    );
    // TODO: better approach?
    // OverwriteModelError: Cannot overwrite `SlackAppInstallation` model once compiled.
    const r = `${new Date().getTime()}-${Math.floor(Math.random() * 1000)}`;
    this.model = this.mongoose.model(`SlackAppInstallation(${r})`, this.schema);
  }

  public async storeInstallation<AuthVersion extends 'v1' | 'v2'>(
    i: Installation<AuthVersion, boolean>,
    logger?: Logger,
  ): Promise<void> {
    const enterpriseId = i.enterprise?.id;
    const teamId = i.team?.id;
    const userId = i.user.id;
    const isEnterpriseInstall = i.isEnterpriseInstall || false;
    const commonLogPart = `(enterprise_id: ${enterpriseId}, team_id: ${teamId}, user_id: ${userId})`;
    logger?.debug(`#storeInstallation starts ${commonLogPart}`);

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const newRow = i as any;
    newRow.__appOrgWorkspace__ = `${this.clientId}:${enterpriseId}:${isEnterpriseInstall ? undefined : teamId}`;
    newRow.__user__ = userId;
    if (this.historicalDataEnabled) {
      await this.model.create(newRow);
    } else {
      const existingRow = await this.model.findOne(this.buildFullQuery({
        enterpriseId,
        teamId,
        userId,
        isEnterpriseInstall,
      }))
        // eslint-disable-next-line @typescript-eslint/naming-convention
        .sort({ _id: -1 })
        .limit(1)
        .exec();
      if (existingRow) {
        // eslint-disable-next-line @typescript-eslint/naming-convention
        await this.model.updateOne({ _id: existingRow._id }, i);
      } else {
        await this.model.create(i);
      }
    }

    logger?.debug(`#storeInstallation successfully completed ${commonLogPart}`);
  }

  public async fetchInstallation(
    query: InstallationQuery<boolean>,
    logger?: Logger,
  ): Promise<Installation<'v1' | 'v2', boolean>> {
    const { enterpriseId, teamId, userId } = query;
    const commonLogPart = `(enterprise_id: ${enterpriseId}, team_id: ${teamId}, user_id: ${userId})`;
    logger?.debug(`#fetchInstallation starts ${commonLogPart}`);

    // eslint-disable-next-line @typescript-eslint/naming-convention
    let row = await this.model.findOne(this.buildFullQuery(query))
      // eslint-disable-next-line @typescript-eslint/naming-convention
      .sort({ _id: -1 })
      .limit(1)
      .exec();
    if (query.userId !== undefined) {
      // Fetch the latest bot data in the table
      const botRow = await this.model.findOne(this.buildBotQuery(query))
        // eslint-disable-next-line @typescript-eslint/naming-convention
        .sort({ _id: -1 })
        .limit(1)
        .exec();
      if (botRow && botRow.bot) {
        if (row) {
          if (!row.bot) {
            row.bot = {};
          }
          row.bot.id = botRow.bot.id;
          row.bot.refreshToken = botRow.bot.refreshToken;
          row.bot.scopes = botRow.bot.scopes;
          row.bot.token = botRow.bot.token;
          row.bot.expiresAt = botRow.bot.expiresAt;
          row.bot.userId = botRow.bot.userId;
        } else {
          row = botRow;
        }
      }
    }
    if (row) {
      logger?.debug(
        `#fetchInstallation found the installation data ${commonLogPart}`,
      );
      return row;
    }
    logger?.debug(
      `#fetchInstallation didn't return any installation data ${commonLogPart}`,
    );
    throw new Error(`No installation data found ${commonLogPart}`);
  }

  public async deleteInstallation(
    query: InstallationQuery<boolean>,
    logger?: Logger,
  ): Promise<void> {
    const { enterpriseId, teamId, userId } = query;
    const commonLogPart = `(enterprise_id: ${enterpriseId}, team_id: ${teamId}, user_id: ${userId})`;
    logger?.debug(`#deleteInstallation starts ${commonLogPart}`);

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const where: any = this.buildFullQuery(query);
    const deletionCount = await this.model.deleteMany(where).exec();
    logger?.debug(
      `#deleteInstallation deleted ${deletionCount} rows ${commonLogPart}`,
    );
  }

  // eslint-disable-next-line class-methods-use-this
  public async close(): Promise<void> {
    await this.mongoose.disconnect();
  }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  private buildBotQuery(query: InstallationQuery<boolean>): any {
    const where = this.buildFullQuery(query);
    delete where.__user__;
    return where;
  }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  private buildFullQuery(query: InstallationQuery<boolean>): any {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const where: any = {};
    const teamId = query.isEnterpriseInstall ? undefined : query.teamId;
    where.__appOrgWorkspace__ = `${this.clientId}:${query.enterpriseId}:${teamId}`;
    if (query.userId) {
      where.__user__ = query.userId;
    }
    return where;
  }
}
