import {
  Installation,
  InstallationQuery,
  InstallationStore,
  Logger,
} from '@slack/oauth';
import { Mongoose, Model, Schema } from 'mongoose';

export interface MongooseInstallationStoreArgs {
  mongoose: Mongoose;
}

export class MongooseInstallationStore implements InstallationStore {
  private mongoose: Mongoose;

  private schema: Schema;

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  private model: Model<any>;

  public constructor(options: MongooseInstallationStoreArgs) {
    this.mongoose = options.mongoose;

    this.schema = new this.mongoose.Schema(
      {
        // eslint-disable-next-line @typescript-eslint/naming-convention
        _enterpriseAndTeam: { type: String, index: true, unique: false },
        // eslint-disable-next-line @typescript-eslint/naming-convention
        _user: { type: String, index: true, unique: false },
      },
      { strict: false, timestamps: { createdAt: 'db_record_created_at', updatedAt: 'db_record_updated_at' } },
    );
    this.model = this.mongoose.model('SlackAppInstallation', this.schema);
  }

  public async storeInstallation<AuthVersion extends 'v1' | 'v2'>(
    i: Installation<AuthVersion, boolean>,
    logger?: Logger,
  ): Promise<void> {
    const enterpriseId = i.enterprise?.id;
    const teamId = i.team?.id;
    const userId = i.user.id;
    const commonLogPart = `(enterprise_id: ${enterpriseId}, team_id: ${teamId}, user_id: ${userId})`;
    logger?.debug(`#storeInstallation starts ${commonLogPart}`);

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const newRow = i as any;
    newRow._enterpriseAndTeam = `${enterpriseId}:${teamId}`;
    newRow._user = userId;
    await this.model.create(i);
    logger?.debug(`#storeInstallation successfully completed ${commonLogPart}`);
  }

  public async fetchInstallation(
    query: InstallationQuery<boolean>,
    logger?: Logger,
  ): Promise<Installation<'v1' | 'v2', boolean>> {
    const { enterpriseId } = query;
    const { teamId } = query;
    const { userId } = query;
    const commonLogPart = `(enterprise_id: ${enterpriseId}, team_id: ${teamId}, user_id: ${userId})`;
    logger?.debug(`#fetchInstallation starts ${commonLogPart}`);

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const where: any = MongooseInstallationStore.buildBaseWhereClause(query);
    // eslint-disable-next-line @typescript-eslint/naming-convention
    const row = await this.model.findOne(where).sort({ _id: -1 }).limit(1).exec();
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
    const { enterpriseId } = query;
    const { teamId } = query;
    const { userId } = query;
    const commonLogPart = `(enterprise_id: ${enterpriseId}, team_id: ${teamId}, user_id: ${userId})`;
    logger?.debug(`#deleteInstallation starts ${commonLogPart}`);

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const where: any = MongooseInstallationStore.buildBaseWhereClause(query);
    const deletionCount = await this.model.deleteMany(where).exec();
    logger?.debug(
      `#deleteInstallation deleted ${deletionCount} rows ${commonLogPart}`,
    );
  }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  private static buildBaseWhereClause(query: InstallationQuery<boolean>): any {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const where: any = {};
    where._enterpriseAndTeam = `${query.enterpriseId}:${query.teamId}`;
    if (query.userId) {
      where._user = query.userId;
    }
    return where;
  }
}
