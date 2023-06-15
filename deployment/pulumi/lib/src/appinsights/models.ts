import * as pulumi from '@pulumi/pulumi';
import { IBaseServiceModel, BaseServiceModel } from '../base';

export interface AppInsightsConfig {
  samplingPercentage: number;
  retentionInDays: number;
}

export interface LogWorkspaceConfig {
  retentionInDays: number;
  dailyQuotaGb: number;
}

export interface ICreateLogWorkspaceModel extends IBaseServiceModel {
  workspaceName: string;
}

export class CreateLogWorkspaceModel extends BaseServiceModel implements ICreateLogWorkspaceModel {
  public workspaceName: string;

  constructor();
  constructor(obj: ICreateLogWorkspaceModel);
  constructor(obj?: any) {
    super(obj);

    if (!obj.workspaceName) {
      throw new Error('workspaceName must be set.');
    }

    this.workspaceName = obj.workspaceName;
  }
}

export interface ICreateApplicationInsightsModel extends IBaseServiceModel {
  componentName: string;
  workspaceId: string | pulumi.Output<string>;
}

export class CreateApplicationInsightsModel extends BaseServiceModel implements ICreateApplicationInsightsModel {
  public componentName: string;
  public workspaceId: string | pulumi.Output<string>;

  constructor();
  constructor(obj: ICreateApplicationInsightsModel);
  constructor(obj?: any) {
    super(obj);

    if (!obj.componentName) {
      throw new Error('componentName must be set.');
    }

    if (!obj.workspaceId) {
      throw new Error('workspaceId must be set.');
    }

    this.componentName = obj.componentName;
    this.workspaceId = obj.workspaceId;
  }
}

export interface ICreateApplicationInsightsResult {
  connectionString: pulumi.Output<string>;
}

export interface ICreateLogWorkspaceResult {
  workspaceId: pulumi.Output<string>;
}
