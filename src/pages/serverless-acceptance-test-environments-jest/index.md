---
title: Parallel Serverless Acceptance Tests
date: "2019-03-12"
tags: ['serverless', 'jest']
---

So you’ve started a Serverless project. If you’re anything like me, you’ve thrown together a quick prototype which you’ve been deploying and testing in your ‘dev’ environment. You know you should be writing tests, but this is a small side project, so you soldier on. Before you know it, you’re making changes, refactoring your code, and having to check a growing number of functions manually. You know that you need to automate this.

This blog post is going to walk through setting up isolated acceptance tests for a Serverless project. These tests will run in parallel using the power of Serverless and the Jest testing framework.

#The Testing Pyramid

Here’s the obligatory mention of the testing period. You know the facts, unit tests are cheap and should be plentiful, integration tests sit in the middle, and acceptance tests are expensive and should be few. However, when you are running in a serverless environment you find that you’re writing less and less code, and relying on external infrastructure even more.

The result of this is that acceptance tests become even more important (that doesn’t mean to say there should be more of them). I’m a big proponent of only acceptance testing the critical paths for an application, but what is critical depends on your application. Additionally, the amount of testing can vary at different stages of your CI/CD pipeline. The questions you ask of your CI environment may be very different to the questions you ask of your production environment. With that out the way, let’s get on!

# Isolated Parallel Environments

I could deploy my application and run the tests against my single ‘dev’ environment, but I’d really like to know that I’m not pushing breaking changes before I integrate.

Since cloud providers only charge us for what we use, there’s rarely a significant cost associated with creating an entirely new environment for a short period of time.

With a Lambda and DynamoDB stack we pay for _exactly_ what we use, so there literally no additional cost if we spin up _multiple_ stacks and run our acceptance tests in parallel.

#Jest

Jest is a modern Javascript testing framework. It executes tests in parallel with one isolated process per test suite (tests in a single spec file).

We can use the hooks jest provides for setting up its execution environment to also set up a Serverless stack per test suite.

Jest’s configuration file provides a ‘testEnvironment’ option where we can provide a custom TestEnvironment implementation. This is going to be our hook.

Our ServerlessTest environment is going to extend the default NodeEnvironment that Jest runs as follows:

[`./src/test/js/acceptance/ServerlessEnvironment.js`](https://github.com/janakerman/serverless-acceptance-tests/blob/master/src/test/js/acceptance/ServerlessEnvironment.js)
```js
class ServerlessEnvironment extends NodeEnvironment {
    constructor(config, context) {
        this.stageName = `acceptance-${uuidv1().slice(0, 7)}`
    }

    async setup() {
        await super.setup()
        await this.createServerlessStack()
        this.global.apiGatewayEndpoint = this.getAPIGatewayEndpoint()
    }

    async teardown() {
        await this.destroyServerlessStack()
        await super.teardown()
    }

    runScript(script) {
        return super.runScript(script)
    }

	// …
}
```

To use this we just need to run Jest with a configuration file pointing to our ServerlessEnvironment implementation. 

[`./src/test/js/acceptance/jest-config.json`](https://github.com/janakerman/serverless-acceptance-tests/blob/master/src/test/js/acceptance/jest-config.json)
```json
{
    "testEnvironment": "./ServerlessEnvironment.js",
    "testEnvironmentOptions": {
        "serviceName": "example-service"
    }
}
```

Then we can run our acceptance tests with the following command.

```sh
jest --config src/test/js/acceptance/jest-config.json
```

Or pop it in our project’s npm scripts for convenience.

[`package.json`](https://github.com/janakerman/serverless-acceptance-tests/blob/master/package.json)
```json
"scripts": {
    "acceptance-test": "jest --config src/test/js/acceptance/jest-config.json"
},
```

Find the full project [here](https://github.com/janakerman/serverless-acceptance-tests).

# When Should I Run these?

**You shouldn’t** use these as part of your development cycle as they’ll take a minute or two end to end. Use unit tests or integration tests with local mocks.

**You could** run these before you push your branch to origin, or run them on feature branches on your CI server (for fire and forget feedback).

**You should** merge master into your feature branch, and run them before deploying to your dev environment.

# A Single Environment

Even with parallel execution there is going to be a time overhead when using a separate stack for each set of tests but if you keep your acceptance test suite for a service small it shouldn’t really be an issue. If for whatever reason it is an issue, I’ll be writing a follow up post detailing how to set up a single stack shared between all tests in the suite.

# In Summary

With very little effort we’ve got a completely isolated test environment with a single command. We can run these on demand from our developer machines to sanity check that our service is still working, and with a correctly designed CI/CD pipeline we can catch breaking changes before they hit our dev environment.

It’s in workflows like this that we really see the benefit of the cloud, especially serverless technologies. Thanks for reading!

# Further Considerations

* Keep your Serverless services small and independent means isolated environment testing is achievable.
* npm run acceptance-test could easily be modified to add arguments to allow the running of acceptance tests against a pre-existing stack as later stages of a CI/CD pipeline.
* Certain scenarios may leave the stack laying around - this needs additional thought to address.

# Versions

Serverless: 1.38.0 