import { Entity, PrimaryGeneratedColumn, Column } from 'typeorm';

@Entity()
export default class SlackAppInstallation {
  @PrimaryGeneratedColumn()
  public id?: number;

  @Column()
  public appId?: string;

  @Column({ nullable: true })
  public enterpriseId?: string;

  @Column({ nullable: true })
  public enterpriseName?: string;

  @Column({ nullable: true })
  public enterpriseUrl?: string;

  @Column({ nullable: true })
  public teamId?: string;

  @Column({ nullable: true })
  public teamName?: string;

  @Column({ nullable: true })
  public botToken?: string;

  @Column({ nullable: true })
  public botId?: string;

  @Column({ nullable: true })
  public botUserId?: string;

  @Column({ nullable: true })
  public botScopes?: string;

  @Column({ nullable: true })
  public botRefreshToken?: string;

  @Column({ nullable: true })
  public botTokenExpiresAt?: Date;

  @Column({ nullable: true })
  public userId?: string;

  @Column({ nullable: true })
  public userToken?: string;

  @Column({ nullable: true })
  public userScopes?: string;

  @Column({ nullable: true })
  public userRefreshToken?: string;

  @Column({ nullable: true })
  public userTokenExpiresAt?: Date;

  @Column({ nullable: true })
  public incomingWebhookUrl?: string;

  @Column({ nullable: true })
  public incomingWebhookChannel?: string;

  @Column({ nullable: true })
  public incomingWebhookChannelId?: string;

  @Column({ nullable: true })
  public incomingWebhookConfigurationUrl?: string;

  @Column({ nullable: true })
  public isEnterpriseInstall?: boolean;

  @Column()
  public tokenType?: string;

  @Column()
  public installedAt?: Date;
}
