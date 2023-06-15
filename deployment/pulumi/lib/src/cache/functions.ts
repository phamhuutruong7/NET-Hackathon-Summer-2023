import * as cache from '@pulumi/azure-native/cache';
import * as models from './models';
import * as base from './../base';

// https://www.pulumi.com/docs/reference/pkg/azure-native/cache/
export function createRedisCache(config: models.IRedisCacheConfig, input: models.CreateRedisCacheModel): models.IRedisResult {
    const serviceName = base.buildServiceName('redis');
    var redis = new cache.Redis(`Redis${serviceName}`, {
      name: serviceName,
      resourceGroupName: input.resourceGroupName,
      enableNonSslPort: input.enableNonSslPort,
      sku: {
        capacity: config.capacity,
        family: config.family,
        name: config.name,
      },
      minimumTlsVersion: input.minimalTlsVersion,
      redisConfiguration: input.redisConfiguration,
  
      tags: input.tags,
    });
  
    return {
      redis,
      primaryKey: redis.accessKeys.primaryKey.apply((x) => x),
      secondaryKey: redis.accessKeys.secondaryKey.apply((x) => x),
    };
  }