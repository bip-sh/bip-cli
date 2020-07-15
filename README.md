# Bip CLI

Bip is an easy to use static website hosting platform.

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

Login with your newly created API key

```shell
bip login
```

### Topup your account

Before you create your first Bip domain, you'll need to topup your account.

```shell
bip account topup <amount>
```

Specify the amount you wish to topup by in the command. A new window will be opened to facilitate the topup.


### Creating your first domain

To create a domain on bip, use the domain create command

```shell
bip domain create <domain>
```

Your domain should be in the format `yourdomain.bip.sh`

### Initialise your project

Use the bip use command to indicate which bip domain should be used when deploying directories

```shell
bip use <domain>
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

### Create domain

To create a domain on bip, use the domain create command

```shell
bip domain create <domain>
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

### Balance

```shell
bip account balance
```

### Topup

To topup your account, enter the amount you wish to topup by with the topup command

```shell
bip account topup <amount>
```

### Initialise a project

Specify the bip domain you wish to deploy to

```shell
bip use <domain>
```

### Deploy a directory

To deploy the contents of a local directory to bip.sh, navigate to the directory and then use bip deploy

```shell
bip deploy
```

### Delete file

```shell
bip delete <filepath>
```
