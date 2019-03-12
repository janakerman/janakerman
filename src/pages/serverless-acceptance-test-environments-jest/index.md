---
title: Serverless acceptance testing with Jest
date: "2019-03-12"
tags: ['javascript','jest','serverless', 'testing', 'acceptance testing', 'AWS']
---

So you’ve started a Serverless project. If you’re anything like me, you’ve thrown together a quick prototype which you’ve been deploying and testing in your ‘dev’ environment. You know you should be writing tests, but this is a small side project, so you soldier on. Before you know it, you’re making changes, refactoring your code, and having to check a growing number of functions manually. You know that you need to automate this.

This blog post is going to walk through setting up an isolated ephemeral test environment for a Serverless project’s acceptance tests.

The code snippets are part of [this project](https://github.com/janakerman/techy-breakky).

## The testing pyramid

Here’s the obligatory mention of the testing period. You know the facts, unit tests are cheap and should be plentiful, integration tests sit in the middle, and acceptance tests are expensive and should be few. However, when you are running in a serverless environment you find that you’re writing less and less code, but relying on external infrastructure even more. 

The result of this is that acceptance tests become even more important (that _doesn’t_ mean to say there should be more of them). I’m a big proponent of only acceptance testing the *critical* paths for an application, but what is critical depends on your application. Additionally, the amount of testing can vary at different stages of your CI/CD pipeline. The questions you ask of your CI environment may be very different to the questions you ask of your production environment. With that out the way, let’s get on!

## An Isolated Environment

I could deploy my application and run the tests against ‘dev’, but I’d really like to know that my changes haven’t broken anything before I push them to CI. So, we’re going to use the hooks that the Jest test framework provides us to create a completely separate environment for our acceptance tests.

Jest gives us two main hooks we could use to spin up our Serverless stack:
1. `globalSetup` - ran once for all tests.
1. `testEnvironment` - ran once for each test suite (file).

I’ve implemented my Serverless initialisation as a `testEnvironment` for simplicity, but I’ll cover some considerations for `globalSetup` at the end of this post.

### Project Structure

I set up separate folder structures for my acceptance (`src/test/js/acceptance`) and unit tests (`src/test/js/unit`) so that I can easily target my different tests with the following npm scripts.

`package.json`
```json
"scripts": {
  "test": "jest --config src/test/js/unit/jest-config.json",
  "acceptance-test": "jest --config src/test/js/acceptance/jest-config.json"
},
```

In each test folder I have a configuration file which allows me to specify the `ServerlessEnvironment` responsible for managing our acceptance test stack.

`src/test/js/acceptance/jest-config.json`
```json
{
  "testEnvironment": "./ServerlessEnvironment.js",
  "testMatch": ["./**/*test.js"]
}
```

The `ServerlessEnvironment` we create looks something like this.

`src/test/js/acceptance/ServerlessEnvironment.js`
```js
class ServerlessEnvironment extends NodeEnvironment {
    constructor(config, context) {
        super(config, context)
        // 1. Generate a pseudo-unique stage name.
    }

    async setup() {
        // 2. Create the serverless stack
        // 3. Get our stack's API Gateway URL
    }

    async teardown() {
        // 4. Remove the serverless stack
    }
}
```

1. We can generate a peudo-unique stage name by generating a uuid:
```js
    constructor(config, context) {
        super(config, context)
        // Generate a pseudo-unique stage name, shorten it due to AWS naming limits.
        this.stageName = `acceptance-${uuidv1().slice(0, 7)}`
    }
```

2. Create our stack by spawning a child process to run our `serverless deploy` command with our unique stage.

```js
    /* Takes a command and arguments to execute as a new process. */
    runCommand(command, ...args) {
        const child = spawn(command, args);

        // Pipe sub-process output to the test output streams.
        child.stdout.pipe(process.stdout)
        child.stderr.pipe(process.stderr)

        // Return a promise
        return new Promise((resolve, reject) => {
            child.on('close', code => {
                console.log(`Finished running '${command} ${args.join(' ')}' ${(code === 0) ? 'suceeded' : 'failed'}`)
                if (code === 0) {
                    resolve()
                } else {
                    reject()
                }
            })
        })
    }

    /* Create the stack with our generated stage name. */
    createServerlessStack() {
        return this.runCommand('serverless', 'deploy', '--stage', this.stageName)
    }

    async setup() {
        console.log(`Creating stack for acceptance tests. Stage name: ${this.stageName}`)
        await super.setup()
        await this.createServerlessStack()
    }
```

3. Get our API Gateway endpoint from our Serverless stack's outputs:

```js
    static async getAPIGatewayEndpoint() {
        const cloudformation = new AWS.CloudFormation({ apiVersion: '2010-05-15' });
        const stack = await cloudformation.describeStacks({ StackName: this.stageName }).promise()
        return stack.Stacks[0].Outputs.find(output => output.OutputKey === 'ServiceEndpoint').OutputValue
    }

    async setup() {
        // ...
        
        this.global.apiGatewayEndpoint = ServerlessEnvironment.getAPIGatewayEndpoint()
    }
```

4. Remove our stack when our tests have finished running:

```js
    destroyServerlessStack() {
        return this.runCommand('serverless', 'remove', '--stage', this.stageName)
    }

    async teardown() {
        await this.destroyServerlessStack()
        console.log('Destroyed acceptance test stack')
        await super.teardown()
    }
```

All that's left to do now is implement an acceptance test.

```js
describe('Example acceptance tests', () => {

    beforeAll(async () => {
        const apiGatewayEndpoint = await global.apiGatewayEndpoint
        this.addOfficeEndpoint = `${apiGatewayEndpoint}/dev/offices`
    })

    test('An example acceptance test', async () => {
        const createResponse = await axios.post(this.addOfficeEndpoint, {
            name: 'London Office',
            items: ['Bacon Sandwich']
        })
        expect(createResponse.status).toBe(200)

        const getResponse = await axios.get(this.addOfficeEndpoint)
        expect(getResponse.data.length).toBe(1)
    })
})
```

To run the test suite in an isolated environment, just run `npm run acceptance-test`.

### Single Stack For All Tests

As mentioned already, the code above will create a new Serverless stack for each test suite. Jest runs tests in parallel (unless you `--runInBand`), you'll have parallel Stacks, so it shouldn't be a huge problem but it will result in slightly longer test runs - that's a trade-off between speed and isolation.

If for whatever reason, you want a single Stack for all your tests, then you can implement the above steps inside of the `globalSetup` & `globalTeardown` hooks provided by Jest options. These will get run once for the entire test run.

```json
    "globalSetup": "./GlobalSetup.js",
    "globalTeardown": "./GlobalTeardown.js"
```

*You'll still need to create a custom TestEnvironment to provide the API Gateway URL. Since Jest test suites are isolated processes. Follow [GitHub Issue](https://github.com/facebook/jest/issues/7184).*


### When Should I Run these?

**You shouldn't** use these as part of your development cycle as they'll take a minute or two end to end. Use unit tests or integration tests with local mocks.

**You could** run these before you push your branch to origin, or run them on feature branches on your CI server (for fire and forget feedback).

**You should** merge master into your feature branch, and run them before deploying to your dev environment.

## In Summary

With very little effort we've got a completely isolated test environment with a single command. We can run these on demand from our developer machines to sanity check that our service is still working, and with a correctly designed CI/CD pipeline we can catch breaking changes before they hit our dev environment.

It's in workflows like this that we really see the benefit of the cloud, especially serverless technologies. Thanks for reading!

### Further Considerations
- Keep your Serverless services small and independent means isolated environment testing is achievable.
- `npm run acceptance-test` could easily be modified to add arguments to allow the running of acceptance tests against a pre-existing stack as later stages of a CI/CD pipeline.
- Killing the test suite half way through will still leave the stack lying around.