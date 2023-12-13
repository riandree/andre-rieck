---
layout: post
title:  "Using the JDK 11 HttpClient to consume JSON responses"
date:   2023-11-16 18:05:00 +0200
categories: java
---

JDK 11 introduced the <a href="https://docs.oracle.com/en/java/javase/21/docs/api/java.net.http/java/net/http/HttpClient.html">java.net.http.HttpClient</a> which is a large improvement over what the JDK had to offer as support for implementing HTTP clients. <br>Starting with JDK 11 Java now offers HTTP-2 support in package `java.net.http` that is much more developer friendly and higher level than what was available out of the box before with the `URL` and `URLConnection` classes.

#### Introduction to the usage of the HttpClient class

The class around which the java.net.http-HTTP-2 API revolves is `HttpClient` which is used to send Http-Requests and retrieve the corresponding Http-Responses.

To use the `HttpClient` class an instance of it has to be set up using the “Builder”-Pattern with `HttpRequest.newBuilder()`. Using this builder one can configure several aspects of the client instance like connection timeouts, proxies, handling of cookies, and more.

Before initiating an Http-Request via the `HttpClient` an `HttpRequest` Object describing the request to be made has to be created using the “Builder”-Pattern again using HttpRequest.newBuilder(URI). With this builder the request properties like headers, Http-Method, Version, etc. can be configured. 
For requests using Http-Methods sending content via the request body an `HttpRequest.BodyPublisher` is used to convert Java-Objects to bytes which will be sent over the network. The JDK provides several types of BodyPublishers out of the box or a custom implementation can be used.

The counterpart of the `HttpRequest` class is the `HttpResponse` interface, instances of which are returned by HttpClients as a result of sending an HttpRequest. Via the `HttpResponse` one can access the response headers, body, and more. 
To unmarshal the bytes received over the network an `HttpClient` uses an instance of interface `HttpResponse.BodyHandler` that is provided to the client with the method invocation that starts the request (like `HttpClient.send(HttpRequest, HttpResponse.BodyHandler)`).

To summarize, the following objects have to be setup to make HTTP requests using HttpClient

- an **HttpClient** most likely using `HttpClient.newBuilder()`
- an **HttpRequest** using `HttpRequest.newBuilder()`
- for requests involving an http request body an **HttpRequest.BodyPublisher** is needed.  Either an out-of-the-box one provided by `HttpRequest.BodyPublishers` or a custom implementation can be used.
- an **HttpResponse.BodyHandler** is needed for unmarshalling the response bytes. Either an out of the box one from **HttpResponse.BodyHandlers** or a custom implementation can be used.

The `BodyHandler` interface facilitates the examination of the response code and headers before the actual response is received. Its primary role is to generate the response `BodySubscriber`, which is responsible for consuming the raw response body bytes, often transforming them into a more abstract Java type.
In essence, a `BodyHandler` can be seen as a function that accepts a `ResponseInfo` object and yields a `BodySubscriber`. This function is called at the point when the response status code and headers become accessible, just before the actual response body bytes are received.

As an example, the following code adapted from the Java documentation for the class `HttpClient` demonstrates a simple use case:

{% highlight java %}
    public static void main(String[] args) throws IOException, InterruptedException {
        HttpClient client = HttpClient.newBuilder()
                .version(HttpClient.Version.HTTP_1_1.HTTP_1_1)
                .followRedirects(HttpClient.Redirect.NORMAL)
                .connectTimeout(Duration.ofSeconds(20))
                .build();

        // No BodyPublisher is needed here since GET does not send a request body
        HttpRequest request = HttpRequest.newBuilder()
                .GET()
                .uri(URI.create("http://www.foo.com/"))
                .build();

        HttpResponse.BodyHandler<String> stringBodyHandler=HttpResponse.BodyHandlers.ofString();

        HttpResponse<String> response = client.send(request, stringBodyHandler);

        System.out.println(response.statusCode());
        System.out.println(response.body());
    }
{% endhighlight %}

#### Handling content-types not supported out-of-the-box like JSON

Unfortunately, the **java.net.http-HTTP-2 API** with its central class `HttpClient` does not support content like JSON, YML, or XML out-of-the-box although many everyday use cases need to process content like this.

To support content like JSON it is necessary to either work with raw Strings and do the conversion to and/or from Java-Objects outside the context of the `HttpClient` or to write custom implementations of `BodyPublisher` when sending such content oder `BodyHandler` when consuming it. 

As an example for how to consume content-types that are not supported by default BodyHandler implementations a client for the 
<a href="https://www.zippopotam.us/" target="_blank">Zippopotam.us</a> web-service has been built. The Zippopotam.us service provides a free API with a JSON response format offering information about zip codes for many different countries.

The <a href="https://github.com/riandree/Java-HttpClient-With-JSON" target="_blank">complete sourcecode for the example</a> can be found on GitHub.

The abstract base class `AbstractZippoClient` found in package **de.rieck.demo** provides records and an enum to model the response 
payload for zipcode-requests and country codes used by the rest-service. This base class prepares the resource URL for requesting 
zipcode information from <a href="https://www.zippopotam.us/" target="_blank">Zippopotam.us</a> and builds an `HttpRequest`
that is then handed to the abstract method `ZippoPostcodeData requestPostcodeData(HttpRequest zippoHttpRequest)` which is implemented
in the subclasses to show different ways of handling JSON responses.

The code provides a JUnit-5 based parameterized test driver (<a href="https://github.com/riandree/Java-HttpClient-With-JSON/blob/main/src/test/java/de/rieck/demo/HttpClientIntegrationTest.java" target="_blank">HttpClientIntegrationTest.java</a>) which integration-tests each of the implementations of <a href="https://github.com/riandree/Java-HttpClient-With-JSON/blob/main/src/main/java/de/rieck/demo/AbstractZippoClient.java" target="_blank">AbstractZippoClient.java</a> namely <a href="https://github.com/riandree/Java-HttpClient-With-JSON/blob/main/src/main/java/de/rieck/demo/HttpClientUsingCustomBodyHandler.java" target="_blank">HttpClientUsingCustomBodyHandler.java</a>, <a href="https://github.com/riandree/Java-HttpClient-With-JSON/blob/main/src/main/java/de/rieck/demo/HttpClientUsingAsyncRequest.java" target="_blank">HttpClientUsingAsyncRequest.java</a> and
<a href="https://github.com/riandree/Java-HttpClient-With-JSON/blob/main/src/main/java/de/rieck/demo/HttpClientUsingPredefinedBodyHandler.java" target="_blank">HttpClientUsingPredefinedBodyHandler.java</a> in turn each time using the same requests.

**Using asynchronous requests**

In this implementation an asynchronous request is used which, among other options, allows to transform the response using
Lambda-Functions. Such a function is used here to transform the `String` valued response payload to a `ZippoPostcodeData` Object 
using the `thenApply` method which then returns a `CompletableFuture`. Finally the parsed result is consumed using the `get()` method of the `CompletableFuture` which synchronizes the asynchronous response with the control flow again.

{% highlight java %}
    public class HttpClientUsingAsyncRequest extends AbstractZippoClient {

        private final ObjectMapper jacksonMapper = new ObjectMapper();

        protected ZippoPostcodeData requestPostcodeData(HttpRequest zippoHttpRequest) {
            try {
                return HttpClient.newHttpClient()
                        .sendAsync(zippoHttpRequest, HttpResponse.BodyHandlers.ofString(StandardCharsets.UTF_8))
                        .thenApply(this::parseJSONResponse)
                        .get();
            } catch (InterruptedException | ExecutionException e) {
                throw new RuntimeException(e);
            }
        }

        private ZippoPostcodeData parseJSONResponse(HttpResponse<String> httpStringResponse) {
            try {
                return jacksonMapper.readValue(httpStringResponse.body(), ZippoPostcodeData.class);
            } catch (JsonProcessingException e) {
                throw new RuntimeException(e);
            }
        }
    }
{% endhighlight %}


**Using a custom BodyHandler**

Another option for transforming the raw response offered by the HttpClient is using a custom implementation
of class `HttpResponse.BodyHandler` that parses the JSON response and turns it into a POJO.
`BodyHandlers` work by optionally inspecting a `ResponseInfo` object and then constructing and returning a 
`BodySubscriber` object which is then used to actually handle and transform the response payload.
In this implementation a custom `BodySubscriber` is chained with a predefined
BodySubscriber which turns the raw payload into a string first.

An instance of the custom `JSONBodyHandler` class is handed to the `HttpClient.send(HttpRequest,HttpResponse.BodyHandler)`
method which results in the body returned by the HttpResponse to be a ZippoPostcodeData POJO.

{% highlight java %}
    public class HttpClientUsingAsyncRequest extends AbstractZippoClient {

        private final ObjectMapper jacksonMapper = new ObjectMapper();

        protected ZippoPostcodeData requestPostcodeData(HttpRequest zippoHttpRequest) {
            try {
                return HttpClient.newHttpClient()
                        .sendAsync(zippoHttpRequest, HttpResponse.BodyHandlers.ofString(StandardCharsets.UTF_8))
                        .thenApply(this::parseJSONResponse)
                        .get();
            } catch (InterruptedException | ExecutionException e) {
                throw new RuntimeException(e);
            }
        }

        private ZippoPostcodeData parseJSONResponse(HttpResponse<String> httpStringResponse) {
            try {
                return jacksonMapper.readValue(httpStringResponse.body(), ZippoPostcodeData.class);
            } catch (JsonProcessingException e) {
                throw new RuntimeException(e);
            }
        }
    }
{% endhighlight %}

**Handle the JSON response as a string parsed outside the context of the HttpClient**

The simplest option is to just use a predefined `BodyHandler` like `HttpResponse.BodyHandlers.ofString(StandardCharsets.UTF_8)` which is used in this last example. The HttpResponse just provides a String in this case that has to be handled outside the context of the HttpClient. 

{% highlight java %}
    public class HttpClientUsingPredefinedBodyHandler extends AbstractZippoClient {

        private final ObjectMapper jacksonMapper = new ObjectMapper();

        protected ZippoPostcodeData requestPostcodeData(HttpRequest zippoHttpRequest) {
            try {
                HttpResponse<String> jsonResponse = HttpClient.newHttpClient()
                        .send(zippoHttpRequest, HttpResponse.BodyHandlers.ofString(StandardCharsets.UTF_8));
                return jacksonMapper.readValue(jsonResponse.body(), ZippoPostcodeData.class);
            } catch (IOException | InterruptedException e) {
                throw new RuntimeException(e);
            }
        }
    }
{% endhighlight %}

#### Conclusion

The JDK 11 HttpClient offers significant improvements over previous Java support for HTTP clients. 
Although HttpClient does not natively support JSON, YML, or XML content, developers can overcome this issue by using custom implementations of BodyPublisher or BodyHandler, or processing raw Strings outside the HttpClient context. 
The examples provided here offer examples  how to deal with JSON responses using different strategies.