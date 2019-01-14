# Gitcoin.cli

A (web)app command line interface to interact with the Standard Bounties Contract and especially the Gitcoin platform.

[Try out the latest version](https://pinkiebell.github.io/Gitcoin.cli/src/)

Clone the repo with `git clone https://github.com/pinkiebell/Gitcoin.cli.git`
You can run `npm install -g .` to have `gitcoin.cli` globally available.

## Additional Setup
Because the Gitcoin.cli also fetches public information from Github, you should setup an [Personal Access Token](https://github.com/settings/tokens).
You do not need special permissions - Public Access is enough.

Inside the Gitcoin.cli, enter:
```
env githubToken=YOUR_TOKEN
```

