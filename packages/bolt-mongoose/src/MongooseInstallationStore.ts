import { ConsoleLogger } from '@slack/logger';
import {
  Installation,
  InstallationQuery,
  InstallationStore,
  Logger,
} from '@slack/oauth';
import { Mongoose, Model, Schema } from 'mongoose';
import MongooseInstallationStoreArgs from './MongooseInstallationStoreArgs';
import { DeleteInstallationCallbackArgs, FetchInstallationCallbackArgs, StoreInstallationCallbackArgs } from './MongooseInstallationStoreCallbackArgs';

export default class MongooseInstallationStore implements InstallationStore {
  private mongoose: Mongoose;

  private historicalDataEnabled: boolean;

  private clientId?: string;

  private logger: Logger;

  private schema: Schema;

  private searchColumnNameForApp: string;

  private searchColumnNameForUser: string;

  private onFetchInstallation: (args: FetchInstallationCallbackArgs) => Promise<void>;

  private onStoreInstallation: (args: StoreInstallationCallbackArgs) => Promise<void>;

  private onDeleteInstallation: (args: DeleteInstallationCallbackArgs) => Promise<void>;

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  private model: Model<any>;

  public constructor(options: MongooseInstallationStoreArgs) {
    this.mongoose = options.mongoose;
    this.historicalDataEnabled = options.historicalDataEnabled !== undefined ?
      options.historicalDataEnabled : true;
    this.clientId = options.clientId;
    this.logger = options.logger !== undefined ?
      options.logger : new ConsoleLogger();
    this.searchColumnNameForApp = options.searchColumnNameForApp || '__appOrgWorkspace__';
    this.searchColumnNameForUser = options.searchColumnNameForUser || '__user__';
    this.onFetchInstallation = options.onFetchInstallation !== undefined ?
      options.onFetchInstallation : async (_) => {};
    this.onStoreInstallation = options.onStoreInstallation !== undefined ?
      options.onStoreInstallation : async (_) => {};
    this.onDeleteInstallation = options.onDeleteInstallation !== undefined ?
      options.onDeleteInstallation : async (_) => {};

    this.schema = options.mongooseSchema || new this.mongoose.Schema(
      {
        // eslint-disable-next-line @typescript-eslint/naming-convention
        [this.searchColumnNameForApp]: { type: String, index: true, unique: false },
        // eslint-disable-next-line @typescript-eslint/naming-convention
        [this.searchColumnNameForUser]: { type: String, index: true, unique: false },
      },
      { strict: false, timestamps: { createdAt: 'db_record_created_at', updatedAt: 'db_record_updated_at' } },
    );
    let modelName = options.mongooseModelName;
    if (modelName === undefined) {
      // TODO: better approach? Appending random value to avoid the following error when instantiating multiple.
      // OverwriteModelError: Cannot overwrite `SlackAppInstallation` model once compiled.
      const r = `${new Date().getTime()}${Math.floor(Math.random() * 10000)}`;
      modelName = `SlackAppInstallation_${r}`;
    }
    this.model = this.mongoose.model(modelName, this.schema);

    this.logger.debug(`PrismaInstallationStore has been initialized (clientId: ${this.clientId}, model: ${modelName})`);
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
      await this.onStoreInstallation({
        entity: newRow,
        installation: i,
        logger: this.logger,
      });
      await this.model.create(newRow);
    } else {
      const where = {
        enterpriseId,
        teamId,
        userId,
        isEnterpriseInstall,
      };
      const existingRow = await this.model.findOne(this.buildFullQuery(where))
        // eslint-disable-next-line @typescript-eslint/naming-convention
        .sort({ _id: -1 })
        .limit(1)
        .exec();
      await this.onStoreInstallation({
        entity: newRow,
        installation: i,
        logger: this.logger,
        query: where,
        idToUpdate: existingRow?._id,
      });
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
    await this.onFetchInstallation({
      query,
      installation: row as Installation,
      logger: this.logger,
    });
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

    await this.onDeleteInstallation({
      query,
      logger: this.logger,
    });
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
    where[this.searchColumnNameForApp] = `${this.clientId}:${query.enterpriseId}:${teamId}`;
    if (query.userId) {
      where[this.searchColumnNameForUser] = query.userId;
    }
    return where;
  }
}
