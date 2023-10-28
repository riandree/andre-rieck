import { Stack, StackProps } from 'aws-cdk-lib';
import * as s3 from 'aws-cdk-lib/aws-s3';
import * as s3deploy from 'aws-cdk-lib/aws-s3-deployment';
import * as cloudfront from 'aws-cdk-lib/aws-cloudfront';
import * as cforigin from 'aws-cdk-lib/aws-cloudfront-origins';
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

    new cloudfront.Distribution(this, 'site-distribution', {
      defaultBehavior: { origin: new cforigin.S3Origin(websiteBucket) },
    });

  }
}
