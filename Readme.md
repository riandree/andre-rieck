Sourcecode and AWS CDK Scripts to deploy www.andre-rieck.dev

"bootstrap" is used as a frontend library together with some html, (s)css and yaml as well as 
"Jekyll" as a static site generator to generate all the static resources
that make up the website.

The AWS CDK is then used to create the infrastructure used to serve the site.
An S3 bucket is set up to keep the static files of this webpage and a CloudFront distribution
is created to cache and serve the content SSL encrypted via HTTPS. 
Furthermore a Route53 hosted zone is created in order to setup the DNS mapping andre-rieck.dev to
the CloudFront distribution.

Since this repository contains personal information (like a picture of myself) the content of this
repo is not meant to be used (other than viewing it) by some else other than the createor of this repository.
**For this reason there was no license chosen for this repo**.
