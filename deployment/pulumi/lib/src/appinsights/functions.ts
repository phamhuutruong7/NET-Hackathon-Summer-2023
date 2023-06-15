import * as insights from '@pulumi/azure-native/insights';
import * as operationalinsights from '@pulumi/azure-native/operationalinsights';
import * as models from './models';

export function createLogWorkspace(
  config: models.LogWorkspaceConfig,
  input: models.CreateLogWorkspaceModel
): models.ICreateLogWorkspaceResult {
  const logWorkspace = new operationalinsights.Workspace('logAnalyticsWorkspace', {
    resourceGroupName: input.resourceGroupName,
    workspaceName: input.workspaceName,
    retentionInDays: config.retentionInDays,
    workspaceCapping: {
      dailyQuotaGb: config.dailyQuotaGb,
    },
    sku: {
      name: 'PerGB2018',
    },
    tags: input.tags,
  });

  return {
    workspaceId: logWorkspace.id,
  };
}

export function createAppInsights(
  config: models.AppInsightsConfig,
  input: models.CreateApplicationInsightsModel
): models.ICreateApplicationInsightsResult {
  const appInsights = new insights.v20200202.Component('appInsights', {
    resourceGroupName: input.resourceGroupName,
    resourceName: input.buildServiceName(input.componentName),
    applicationType: insights.ApplicationType.Web,
    kind: insights.ApplicationType.Web,
    disableIpMasking: false,
    ingestionMode: insights.IngestionMode.LogAnalytics,
    workspaceResourceId: input.workspaceId,
    retentionInDays: config.retentionInDays,
    samplingPercentage: config.samplingPercentage,
    flowType: insights.FlowType.Bluefield,
    requestSource: insights.RequestSource.Rest,

    tags: input.tags,
  });

  return {
    connectionString: appInsights.connectionString,
  };
}
