Sourcecode and AWS CDK Scripts to deploy www.andre-rieck.dev

"bootstrap" is used as a frontend library together with some html, (s)css and yaml as well as 
"Jekyll" as a static site generator to generate all the static resources
that make up the website.

The AWS CDK is then used to create the infrastructure used to serve the site.
An S3 bucket is set up to keep the static files of this webpage and a CloudFront Distribution
is created to cache and serve the content SSL encrypted via HTTP.