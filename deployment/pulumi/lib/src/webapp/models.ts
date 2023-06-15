import * as pulumi from '@pulumi/pulumi';
import * as web from '@pulumi/azure-native/web';
import * as keyvault from '@pulumi/azure-native/keyvault';
import * as storage from '@pulumi/azure-native/storage';
import * as cdn from '@pulumi/azure-native/cdn';
import { IBaseServiceModel, BaseServiceModel } from "../base";
import { ICreateSqlServerResult } from '../sql';
import { ICreateStorageAccountResult } from '../storage';
import { AcrConfig, AcrCredentials } from '../acr';

export interface AppServicePlanConfig {
    name: string;
    tier: string;
    capacity: number | undefined;
}

export interface StaticSiteConfig {
    sku: string;
    contentTypesToCompress: string[];
}

/**
 * ICreateAppServicePlanModel
 */
interface ICreateAppServicePlanModel extends IBaseServiceModel {
    kind: string;
    reserved: boolean;
}

/**
 * CreateAppServicePlanModel
 */
export class CreateAppServicePlanModel extends BaseServiceModel implements ICreateAppServicePlanModel {
    public kind: string;
    public reserved: boolean;

    constructor();
    constructor(obj: ICreateAppServicePlanModel);
    // eslint-disable-next-line
    constructor(obj?: any) {
        super(obj);

        this.kind = obj.kind || 'Linux'; // Windows, Linux, FunctionApp
        this.reserved = obj.reserved || this.kind === 'Linux';
    }
}

/**
 * ICreateAppServicePlanModel
 */
interface ICreateStaticSiteModel extends IBaseServiceModel {
    siteName: string | pulumi.Input<string>;
}

/**
 * CreateAppServicePlanModel
 */
export class CreateStaticSiteModel extends BaseServiceModel implements ICreateStaticSiteModel {
    public siteName: string | pulumi.Input<string>;

    constructor();
    constructor(obj: ICreateStaticSiteModel);
    // eslint-disable-next-line
    constructor(obj?: any) {
        super(obj);

        if (!obj.siteName) {
            throw new Error('siteName must be set.');
        }
        this.siteName = obj.siteName;
    }
}

interface ICreateWebAppModel extends IBaseServiceModel {
    additionalAppsettings?: { name: string; value: pulumi.Input<string> }[];
    secrets?: { name: string; value: pulumi.Input<string> }[];

    imageName?: string | pulumi.Input<string>;

    // Possible values for worker runtime are: "dotnet" and "dotnet-isolated"
    // You can read more about different settings and runtime at below URLs
    // https://docs.microsoft.com/en-us/azure/azure-functions/functions-app-settings#functions_worker_runtime
    // https://docs.microsoft.com/en-us/azure/azure-functions/dotnet-isolated-process-guide#net-isolated-project
    // https://docs.microsoft.com/en-us/azure/azure-functions/functions-app-settings
    workerRuntime?: string;

    aspnetCoreEnvironment: string | pulumi.Input<string>;
    appInsightsConnectionString: string | pulumi.Input<string>;
    sqlResult?: ICreateSqlServerResult;
    storageResult?: ICreateStorageAccountResult;
    acr: AcrCredentials;
    teamGroupObjectIdArray: string[] | pulumi.Input<string>[];
    dockerDeployment: boolean;
    alwaysOn?: boolean;
}

export class CreateWebAppModel extends BaseServiceModel implements ICreateWebAppModel {
    public additionalAppsettings?: { name: string; value: pulumi.Input<string> }[];
    public secrets?: { name: string; value: pulumi.Input<string> }[];

    public imageName?: string | pulumi.Input<string>;
    public workerRuntime?: string;
    public aspnetCoreEnvironment: string | pulumi.Input<string>;
    public appInsightsConnectionString: string | pulumi.Input<string>;
    public sqlResult?: ICreateSqlServerResult;
    public storageResult?: ICreateStorageAccountResult;
    public acr: AcrCredentials;
    public teamGroupObjectIdArray: string[] | pulumi.Input<string>[];
    public dockerDeployment: boolean;
    public alwaysOn?: boolean;

    constructor();
    constructor(obj: ICreateWebAppModel);
    // eslint-disable-next-line
    constructor(obj?: any) {
        super(obj);

        if (!obj.aspnetCoreEnvironment) {
            throw new Error('aspnetCoreEnvironment must be set.');
        }
        this.aspnetCoreEnvironment = obj.aspnetCoreEnvironment;

        if (!obj.appInsightsConnectionString) {
            throw new Error('appInsightsConnectionString must be set.');
        }
        this.appInsightsConnectionString = obj.appInsightsConnectionString;

        if (!obj.acr) {
            throw new Error('acr must be set.');
        }
        this.acr = obj.acr;

        if (!obj.teamGroupObjectIdArray) {
            throw new Error('teamGroupObjectIdArray must be set.');
        }

        if (obj.dockerDeployment) {
            this.imageName = pulumi.interpolate`DOCKER|${obj.imageName}`;
        } else {
            this.imageName = obj.imageName;
        }

        this.alwaysOn = obj.alwaysOn || true;
        this.dockerDeployment = obj.dockerDeployment;
        this.workerRuntime = obj.workerRuntime;
        this.sqlResult = obj.sqlResult;
        this.storageResult = obj.storageResult;
        this.teamGroupObjectIdArray = obj.teamGroupObjectIdArray || [];
        this.additionalAppsettings = obj.additionalAppsettings || [];
        this.secrets = obj.secrets || [];
    }
}


// output interface for 'createWebApp'; adjust as necessary
export interface IWebAppResult {
    plan: web.AppServicePlan;
    webApp: web.WebApp;
    keyVault: keyvault.Vault;
  }
  
  export interface ICreateStaticSiteAndCdnResult {
    storageAccount: storage.StorageAccount;
    staticSite: storage.StorageAccountStaticWebsite;
    cdnEndpoint: cdn.Endpoint;
  }