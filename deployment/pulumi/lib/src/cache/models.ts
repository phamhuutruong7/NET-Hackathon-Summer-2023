import * as pulumi from '@pulumi/pulumi';
import * as cache from '@pulumi/azure-native/cache';
import { IBaseServiceModel, BaseServiceModel } from '../src/base';

export interface IRedisCacheConfig {
    /**
     * Valid values: for C (Basic/Standard) family (0, 1, 2, 3, 4, 5, 6), for P (Premium) family (1, 2, 3, 4).
     */
    capacity: number;
  
    /**
     * Valid values: C | P
     */
    family: string;
  
    /**
     * Valid values: Basic | Standard | Premium
     */
    name: string;
  }

interface ICreateRedisCacheModel extends IBaseServiceModel {
  /**
   * Custom Redis config
   */
  redisConfiguration?: { [key: string]: pulumi.Input<string> };
  minimalTlsVersion?: string;
  enableNonSslPort?: boolean;
}

export class CreateRedisCacheModel extends BaseServiceModel implements ICreateRedisCacheModel {
  public redisConfiguration?: { [key: string]: pulumi.Input<string> };
  public minimalTlsVersion?: string;
  public enableNonSslPort?: boolean;

  constructor();
  constructor(obj: ICreateRedisCacheModel);
  // eslint-disable-next-line
  constructor(obj?: any) {
    super(obj);

    this.redisConfiguration = obj.redisConfiguration;
    this.minimalTlsVersion = obj.minimalTlsVersion || '1.2';
    this.enableNonSslPort = obj.enableNonSslPort || false;
  }
}

export interface IRedisResult {
  redis: cache.Redis;
  primaryKey: pulumi.Output<string>;
  secondaryKey: pulumi.Output<string>;
}

