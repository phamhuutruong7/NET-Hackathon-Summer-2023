import * as pulumi from '@pulumi/pulumi';
import { IBaseServiceModel, BaseServiceModel } from '../base';


export interface AcrCredentials {
  id: pulumi.Input<string>;
  loginServer: pulumi.Input<string>;
}

export interface AcrConfig {
    skuName: string;
}

export interface ICreateContainerRegistryModel extends IBaseServiceModel {
    registryName: string;
    adminUserEnabled?: boolean; // set to true if you don't use RBAC
}
  
  export class CreateContainerRegistryModel extends BaseServiceModel implements ICreateContainerRegistryModel {
    public registryName: string;
    public adminUserEnabled?: boolean; // set to true if you don't use RBAC
  
    constructor();
    constructor(obj: ICreateContainerRegistryModel);
    constructor(obj?: any) {
      super(obj);
  
      if (!obj.registryName) {
        throw new Error('registryName must be set.');
      }

      this.registryName = obj.registryName;
      this.adminUserEnabled = obj.adminUserEnabled || false;
    }
  }