import { AmplifyAuthCognitoStackTemplate, AmplifyProjectInfo } from '@aws-amplify/cli-extensibility-helper';

export function override(resources: AmplifyAuthCognitoStackTemplate, amplifyProjectInfo: AmplifyProjectInfo) {
	const explicitAuthFlows = [
		'ALLOW_USER_PASSWORD_AUTH',
		'ALLOW_USER_SRP_AUTH',
		'ALLOW_REFRESH_TOKEN_AUTH',
	];

	if (resources.userPoolClient) {
		resources.userPoolClient.explicitAuthFlows = explicitAuthFlows;
	}

	if (resources.userPoolClientWeb) {
		resources.userPoolClientWeb.explicitAuthFlows = explicitAuthFlows;
	}
}
