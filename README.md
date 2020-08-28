# Bip CLI

The super fast static website hosting platform.

## Getting started
### Signup

Install bip-cli via npm

```shell
npm i -g @bip-sh/cli
```

Signup for an account

```shell
bip signup
```

Login with your new account

```shell
bip login
```


### Creating your first domain

To create a domain on Bip, use the domain create command

```shell
bip domain create
```

Your domain should be in the format `yourdomain.bip.sh`

### Initialise your project

Use the bip use command to indicate which Bip domain should be used when deploying directories

```shell
bip init
```

### Deploy your project

Finally, use the deploy command to deploy your website to Bip

```shell
bip deploy
```

Your website is now live on Bip.

## Commands

### Login

```shell
bip login
```

### Logout

```shell
bip logout
```

### Signup

```shell
bip signup
```

### Who am I

```shell
bip whoami
```

### Create domain

To create a domain on Bip, use the domain create command

```shell
bip domain create
```

Your domain should be in the format `yourdomain.bip.sh`

### List your domains

```shell
bip domain list
```

### Delete domain

```shell
bip domain delete <domain>
```

### Billing

Open the billing portal to see your active subscriptions and the payment card(s) attached to your account

```shell
bip account billing
```

### Initialise a project

Initialise your project

```shell
bip init
```

### Deploy a directory

To deploy the contents of a local directory to Bip, navigate to the directory and then use bip deploy

```shell
bip deploy
```
