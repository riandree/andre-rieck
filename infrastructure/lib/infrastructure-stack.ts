import { Stack, StackProps, Duration, CfnOutput, Fn } from 'aws-cdk-lib';

import * as s3 from 'aws-cdk-lib/aws-s3';
import * as s3deploy from 'aws-cdk-lib/aws-s3-deployment';
import * as cloudfront from 'aws-cdk-lib/aws-cloudfront';
import * as acm from 'aws-cdk-lib/aws-certificatemanager';
import * as cforigin from 'aws-cdk-lib/aws-cloudfront-origins';
import * as route53 from 'aws-cdk-lib/aws-route53';
import * as route53Targets from 'aws-cdk-lib/aws-route53-targets';
import DeployProps from './props';

import { Construct } from 'constructs';

export class InfrastructureStack extends Stack {
  constructor(scope: Construct, id: string, props?: StackProps) {
    super(scope, id, props);

    const websiteBucket = new s3.Bucket(this, 'site-bucket', {
      blockPublicAccess: s3.BlockPublicAccess.BLOCK_ALL
    });

    new s3deploy.BucketDeployment(this, 'site-deployment', {
      sources: [s3deploy.Source.asset('../site/_site')],
      destinationBucket: websiteBucket
    });

    const noCacheResponseHeadersPolicy = new cloudfront.ResponseHeadersPolicy(this, 'ResponseHeadersPolicy', {
      customHeadersBehavior: {
        customHeaders: [
          { header: 'Cache-Control', value: 'no-store', override: true },
        ],
      },
    });
    
    const errorResponse404: cloudfront.ErrorResponse = {
      httpStatus: 404,
      responseHttpStatus: 404,
      responsePagePath: '/404.html',
      ttl: Duration.minutes(5),
    };

    // a "props.ts" is required which is not under version control in order not to publish the account Id
    // export default {
    //    certificateARN : "arn:aws:acm:us-east-1:<ACCOUNT_ID>:certificate/<CERTIFICATE_ID>"
    // }
    const arn = DeployProps.certificateARN;
    const certificate = acm.Certificate.fromCertificateArn(this, 'Certificate', arn);

    const siteDistribution=new cloudfront.Distribution(this, 'site-distribution', {
      defaultBehavior: { 
        origin: new cforigin.S3Origin(websiteBucket),
        viewerProtocolPolicy : cloudfront.ViewerProtocolPolicy.REDIRECT_TO_HTTPS,
        responseHeadersPolicy : noCacheResponseHeadersPolicy
      },
      defaultRootObject : "index.html",
      certificate : certificate,
      domainNames : ['andre-rieck.dev','www.andre-rieck.dev'],
      errorResponses : [errorResponse404] 
    });

    const siteZone=new route53.PublicHostedZone(this, 'site-zone', {
      zoneName: 'andre-rieck.dev',
    });

    new route53.ARecord(this, 'distributionAlias', {
      zone: siteZone,
      target: route53.RecordTarget.fromAlias(new route53Targets.CloudFrontTarget(siteDistribution)),
    });
    new route53.CnameRecord(this, 'distributionWWWCname', {
      zone: siteZone,
      domainName : 'andre-rieck.dev',
      recordName : 'www'
    });

    const nsArray = siteZone.hostedZoneNameServers as string[];
    const nsList = Fn.join(',', nsArray );
    new CfnOutput(this, 'NameServerList', { value: nsList });
  }
}
