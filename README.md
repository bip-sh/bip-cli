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

Use the bip use command to indicate which bip domain should be used when uploading and syncing directories

```shell
bip use <domain>
```

### Sync your directory

Finally, use the sync command to deploy your website to Bip

```shell
bip sync
```

Your website is now live on Bip.

## Commands

### Domains
#### Create domain

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

### Topup

To topup your account, enter the amount you wish to topup by with the topup command

```shell
bip account topup <amount>
```

### Initialise a project

Specify the domain you wish to upload/sync to with bip use

```shell
bip use <domain>
```

### Sync a directory

To upload the contents of a local directory to bip.sh, navigate to the directory and then use bip sync

```shell
bip sync
```
