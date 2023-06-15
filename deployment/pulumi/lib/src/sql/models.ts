import * as pulumi from '@pulumi/pulumi';
import * as sql from '@pulumi/azure-native/sql';
import { IBaseServiceModel, BaseServiceModel } from "../base";

export interface SqlDbDtuConfig {
    tier: string;
    capacity: number;
    size: number;
}

export interface ICreateSqlServerModel extends IBaseServiceModel {
    /**
     * SQL Server Version
     */
    version?: string;
  
    minimalTlsVersion?: string;
    adminLoginName: string;
    adminLoginSID: string;

    databaseName: string;
  }
  
  export class CreateSqlServerModel extends BaseServiceModel implements ICreateSqlServerModel {
    public version?: string;
    public minimalTlsVersion?: string;
    public adminLoginName: string;
    public adminLoginSID: string;
    public databaseName: string;
  
    constructor();
    constructor(obj: ICreateSqlServerModel);
    // eslint-disable-next-line
    constructor(obj?: any) {
        super(obj);
  
        if (!obj.adminLoginName) {
            throw new Error('adminLoginName must be set.');
        }
        this.adminLoginName = obj.adminLoginName;
  
        if (!obj.adminLoginSID) {
            throw new Error('adminLoginSID must be set.');
        }
        this.adminLoginSID = obj.adminLoginSID;

        if (!obj.databaseName) {
            throw new Error('databaseName must be set.');
        }
        this.databaseName = obj.databaseName;
  
        this.version = obj.version || '12.0';
        this.minimalTlsVersion = obj.minimalTlsVersion || '1.2';
    }
  }

export interface ICreateSqlServerResult {
    dbAdmin: {
        username: pulumi.Output<string>;
        password: pulumi.Output<string>;
    };
    sqlServer: sql.Server;
    connectionString: pulumi.Output<string>;
}