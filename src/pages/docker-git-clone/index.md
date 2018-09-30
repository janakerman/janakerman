---
title: Cloning Files From Git into a Docker Image
date: "2018-09-30"
---

I came across a scenario recently whereby I had a hard requirement to create a fully ready Jenkins container. This meant baking in our job DSL into the image itself, but these files were in a Git repository.


It would have been simple enough to do the clone the repository into container as a Dockerfile step, but this approach has a few issues.
1. The entire repo including all git history is pulled down (unless you clean up after yourself)
2. You'll expose your private SSH key in one of your image layers, **even if you delete it afterwards**

We can do better using a multi-stage docker build. Multi-stage docker builds allow you to build a set of layers during your build that will be discarded after the build. Using the `COPY` command, content from these discarded layers can be cherry picked into your final image.

Take the Dockerfile below as an example.

```docker
# Choose and name our temporary image.
FROM alpine as intermediate
# Add metadata identifying these images as our build containers (this will be useful later!)
LABEL stage=intermediate

# Take an SSH key as a build argument.
ARG SSH_PRIVATE_KEY

# Install dependencies required to git clone.
RUN apk update && \
    apk add --update git && \
    apk add --update openssh

# 1. Create the SSH directory.
# 2. Populate the private key file.
# 3. Set the required permissions.
# 4. Add github to our list of known hosts for ssh.
RUN mkdir -p /root/.ssh/ && \
    echo "$SSH_KEY" > /root/.ssh/id_rsa && \
    chmod -R 600 /root/.ssh/ && \
    ssh-keyscan -t rsa github.com >> ~/.ssh/known_hosts

# Clone a repository (my website in this case)
RUN git clone git@github.com:janakerman/janakerman.git

# Choose the base image for our final image
FROM alpine

# Copy accross the files from our `intermediate` container
RUN mkdir files
COPY --from=intermediate /janakerman/README.md /files/README.md
```

After setting your SSH Key as an environment variable and building the container:

```
MY_KEY=$(cat ~/.ssh/id_rsa)
docker build --build-arg SSH_KEY="$MY_KEY" --tag clone-example .
...
> Successfully tagged clone-example:latest
```

You can inspect the container to see that the relevant files have been copied accross.

```
docker run -ti --rm clone-example ls /files
> README.md
```

In my case I used the Jenkins credentials plugin to populate an environment variable which was then used in the `--build-arg`.

# Removing All Trace

Inspecting the layers of the built docker image shows us that the intermediate stages with sensitive information are not included.

```
docker history clone-example
> IMAGE               CREATED             CREATED BY                                      SIZE
>b3dbbf389a73        2 minutes ago       /bin/sh -c #(nop) COPY file:90e3ecf812fe16bf…   254B
>39d11e01b3ad        2 minutes ago       /bin/sh -c mkdir files                          0B
>196d12cf6ab1        2 weeks ago         /bin/sh -c #(nop)  CMD ["/bin/sh"]              0B
><missing>           2 weeks ago         /bin/sh -c #(nop) ADD file:25c10b1d1b41d46a1…   4.41MB
```

These intermediate build images are still cached on your machine though. If we inspect our build logs, we can see all of the layers that remained behind. This might not be much of an issue on your local machine, but on a shared build server, someone could easily run one of those images and steal your build server's private SSH key.

However, in the above example we used docker's `LABEL` command to label the intermediate images. The `LABEL` is a key value pair that exists as a way of adding metadata to images, all subsequent image layers inherit their parent's tags.

To delete our intermediate containers we run a docker remove command with a filter.

```
docker rmi -f $(docker images -q --filter label=stage=intermediate)
```

Now there's no trace of the SSH key left lying around!
