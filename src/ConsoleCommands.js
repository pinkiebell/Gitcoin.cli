
class HelpCommand {
  constructor(cmd, args, console) {
    const cmds = Object.keys(ConsoleCommands);

    while (cmds.length) {
      const cmd = cmds.shift();

      console.writeLine(cmd + ':');
      console.writeLine('\t' + (ConsoleCommands[cmd].DESCRIPTION || 'No description'));
    }
  }
}
HelpCommand.DESCRIPTION = 'list available commands';


class StatusCommand {
  constructor(cmd, args, console) {
    this.console = console;

    StandardBountyContract.getNumBounties(console.network, this.onGetNumBounties, this);
    console.writeLine('Web3 version: ' + Web3.version);
    console.writeLine('Sync in progress: ' + (console.bountyNum > 0));
  }

  onGetNumBounties(res) {
    this.console.writeLine('Number of bounties in ' + this.console.network + ': ' + res);
  }
}
StatusCommand.DESCRIPTION = 'status information for current network';


class ProfileCommand {
  constructor(cmd, args, console) {
    this.console = console;

    if (!args[0]) {
      this.console.writeLine(this.constructor.DESCRIPTION);
      return;
    }

    this.askedFor = args[0].toLowerCase();

    this.accepted = [];
    this.submitted = [];
    this.started = [];
    this.other = [];
    this.funded = [];

    BountyModel.loadAll(-1, console.network, this.onBounty, this);
  }

  onBounty(bountyModel, queryDone) {
    if (!bountyModel) {
      return;
    }

    const handle = bountyModel.issuerUsername;
    let tmp = false;

    if (handle && handle.toLowerCase().indexOf(this.askedFor) !== -1) {
      tmp = true;
      this.funded.push(handle + '(funder):' + bountyModel.shortDescription);
    }

    const fmnts = bountyModel.fulfillments || [];
    const len = fmnts.length;
    let accepted = false;
    let submitted = false;
    let username = '';

    for (let i = 0; i < len; i++) {
      const fulfillment = fmnts[i];

      let foo = fulfillment.ipfsBlob;
      if (!foo) {
        continue;
      }
      foo = foo.payload;
      if (!foo) {
        continue;
      }
      foo = foo.fulfiller;
      if (!foo) {
        continue;
      }
      foo = foo.githubUsername;
      if (!foo) {
        continue;
      }
      if (foo.toLowerCase().indexOf(this.askedFor) !== -1) {
        username = foo;
        submitted = true;

        if (fulfillment.accepted) {
          accepted = true;
        }
      }
    }

    if (accepted) {
      tmp = true;
      this.accepted.push(username + '(worker):' + bountyModel.shortDescription);
    } else if (submitted) {
      tmp = true;
      this.submitted.push(username + '(worker):' + bountyModel.shortDescription);
    }

    if (!tmp) {
      if (bountyModel.githubTimeline) {
        let len = bountyModel.githubTimeline.length;
        let isMatch = false;
        let hasPR = false;
        let hasStartedWork = false;

        while (len--) {
          const comment = bountyModel.githubTimeline[len];
          const user = comment.actor || comment.user;
          if (comment.source && comment.source.issue.pull_request) {
            hasPR = true;
          }

          if (user && user.login.toLowerCase().indexOf(this.askedFor) !== -1) {
            isMatch = true;
          }

          if (comment.event !== 'commented' || !user) {
            continue;
          }

          if (user.login === 'gitcoinbot') {
            if (comment.body.indexOf('**Started**') !== -1 &&
                comment.body.toLowerCase().indexOf(this.askedFor) !== -1) {

              hasStartedWork = true;
            }
          }
        }

        if (hasStartedWork) {
          this.started.push(username + '(worker):' + bountyModel.shortDescription);
        } else if (isMatch) {
          this.other.push('(github reference' + (hasPR ? '/w/PR' : '') + '):' + bountyModel.shortDescription);
        }
      }
    }

    if (queryDone) {
      this.console.clearLine();

      this.console.writeLine('\nOther Bounties with GitHub References (' + this.other.length + ')');
      while (this.other.length) {
        this.console.writeLine('    ' + this.other.pop());
      }

      this.console.writeLine('\nAccepted Bounties (' + this.accepted.length + ')');
      while (this.accepted.length) {
        this.console.writeLine('    ' + this.accepted.pop());
      }

      this.console.writeLine('\nSubmitted Bounties (' + this.submitted.length + ')');
      while (this.submitted.length) {
        this.console.writeLine('    ' + this.submitted.pop());
      }

      this.console.writeLine('\nStarted Bounties (' + this.started.length + ')');
      while (this.started.length) {
        this.console.writeLine('    ' + this.started.pop());
      }

      this.console.writeLine('\nFunded Bounties (' + this.funded.length + ')');
      while (this.funded.length) {
        this.console.writeLine('    ' + this.funded.pop());
      }

      return;
    }

    this.console.clearLine();
    this.console.write('searching ' + bountyModel.id);
  }
}
ProfileCommand.DESCRIPTION = '<github username>\n\tprint information about the github user';


class NetworkCommand {
  constructor(cmd, args, console) {
    if (args[0]) {

      console.network = args[0];
      console.writeLine('Switched to network: ' + console.network);
      return;
    }
    console.writeLine('Current network: ' + console.network);
  }
}
NetworkCommand.DESCRIPTION = '[network]\n\tPrint or switch current network';


class ExploreCommand {
  constructor(cmd, args, console) {
    this.console = console;

    this.status = (args.shift() || 'Open').toLowerCase();
    this.platform = (args.shift() || 'gitcoin').toLowerCase();
    this.keywords = args;

    this.console.writeLine('You can use * as a wild card searching term.');
    this.console.writeLine('Exploring status:' + this.status + ' platform:' + this.platform);

    BountyModel.loadAll(-1, console.network, this.onBounty, this);
  }

  onBounty(bountyModel) {
    if (!bountyModel) {
      return;
    }

    if ((this.status === '*' || this.status === bountyModel.status.toLowerCase())
      && (this.platform === '*' || this.platform === bountyModel.platform.toLowerCase())) {

      let len = this.keywords.length;
      let matches = false;
      while (len--) {
        if (bountyModel.categories.toString().toLowerCase().indexOf(this.keywords[len].toLowerCase()) !== -1) {
          matches = true;
        }
      }
      if (!this.keywords.length || matches) {
        this.console.writeLine(bountyModel.shortDescription);
      }
    }
  }
}
ExploreCommand.DESCRIPTION = '<status> <platform> [keywords]';


class VisitCommand {
  constructor(cmd, args, console) {
    this.console = console;

    BountyModel.load(parseInt(args[0]), console.network, this.onLoadBounty, this);
  }

  onLoadBounty(bountyModel) {
    if (!bountyModel) {
      this.console.writeLine('Not found');
      return;
    }

    this.console.writeLine(bountyModel.url);
    this.console.writeLine('You may have to allow Pop-ups.');
    window.open(bountyModel.url, '_blank');
  }
}
VisitCommand.DESCRIPTION = '<bounty number>\n\tVisit bounty issue url';


class ClearCommand {
  constructor(cmd, args, console) {
    console.clear();
  }
}
ClearCommand.DESCRIPTION = 'clear the screen';


class CommentsCommand {
  constructor(cmd, args, console) {
    this.console = console;

    BountyModel.load(parseInt(args[0]), console.network, this.onLoadBounty, this);
  }

  onLoadBounty(bountyModel) {
    if (!bountyModel) {
      this.console.writeLine('Not found');
      return;
    }

    let url = bountyModel.url;
    if (!url) {
      this.console.writeLine('No issue URL');
      return;
    }

    this.console.writeLine(bountyModel.title);
    this.console.writeLine(url);
    Github.fetchComments(url, this.onFetchComments, this);
  }

  onFetchComments(res, status) {
    if (!res) {
      this.console.writeLine('Github fetch error, status = ' + status);
      return;
    }

    const len = res.length;
    for (let i = 0; i < len; i++) {
      const comment = res[i];
      this.console.writeLine('***');
      this.console.writeLine(comment.user.login + ' @ ' + comment.updated_at + '\n');
      this.console.writeLine(comment.body + '\n***\n');
    }
  }
}
CommentsCommand.DESCRIPTION = '<bounty number>\n\tfetch github comments';


class EchoCommand {
  constructor(cmd, args, console) {
    console.writeLine(args.join(' '));
  }
}
EchoCommand.DESCRIPTION = 'echo back';


class WalletCommand {
  constructor(cmd, args, console) {
    this.console = console;

    if (!console.walletProvider) {
      console.writeLine('No wallet provider o.O');
      return;
    }

    console.web3Wallet.eth.net.getNetworkType().then(
      function(res) {
        console.writeLine('wallet network: ' + res);
      }
    );

    console.web3Wallet.eth.getAccounts().then(
      function(res) {
        while (res.length) {
          let addr = res.pop();
          console.web3Wallet.eth.getBalance(addr).then(
            function(balance) {
              console.writeLine(addr + ' / ' + (balance / 10**18));
            }
          );
        }
      }
    );
  }
}
WalletCommand.DESCRIPTION = 'wallet';


class EnvironmentCommand {
  constructor(cmd, args, console) {
    if (args.length) {
      while (args.length) {
        let tmp = args.pop().split('=');
        let key = tmp[0];
        let val = tmp[1];
        if (key && val) {
          console.env[key] = val;
        }
      }
      console.saveEnv();
      console.applyEnv();
    }

    console.log(console.env);
  }
}
EnvironmentCommand.DESCRIPTION = 'Maybe has something to do with settings.';


class TextToSpeechCommand {
  constructor(cmd, args, console) {
    const cond = console.env.canSpeak ? 'disable' : 'enable';

    console.write(
      'Do you want me to ' + cond + ' Speech synthesis?\n' +
      'Write Yes or No.\n'
    );
  }

  onInput(str, console) {
    if (str.toLowerCase().indexOf('yes') !== -1) {
      console.env.canSpeak = !console.env.canSpeak;
      console.saveEnv();
    }

    console.writeLine('Fine, Speech synthesis is ' + (console.env.canSpeak ? 'enabled' : 'disabled'));

    // no more input please
    return false;
  }
}
TextToSpeechCommand.DESCRIPTION = 'Enable or disable Speech synthesis';


class EvalCommand {
  constructor(cmd, args, console) {
    try {
      eval(args.join(''));
    } catch (e) {
      console.log(e.toString());
    }
  }
}
EvalCommand.DESCRIPTION = 'eval in the console context';


class DanglingCommand {
  constructor(cmd, args, console) {
    this.console = console;

    BountyModel.loadAll(-1, console.network, this.onBounty, this);
  }

  onBounty(bountyModel, queryDone) {
    if (!bountyModel) {
      return;
    }

    const handle = bountyModel.issuerUsername;
    let tmp = false;

    if (bountyModel.bountyStage === 1 &&
        bountyModel.platform === 'gitcoin' &&
        bountyModel.gitcoinbotStatus === 'Started') {
      if (bountyModel.balanceValue > 0.0) {
        const fmnts = bountyModel.fulfillments || [];
        if (fmnts.length === 0) {
          if (bountyModel.githubTimeline) {
            let dangling = true;
            let len = bountyModel.githubTimeline.length;
            let lastUpdated = new Date(0);
            let dateNow = new Date();

            while (len--) {
              let obj = bountyModel.githubTimeline[len];

              if (obj.updated_at) {
                let tmp = new Date(obj.updated_at);
                if (tmp > lastUpdated) {
                  lastUpdated = tmp;
                }
                if (dateNow - lastUpdated < (3600 * 24 * 10 * 1000)) {
                  dangling = false;
                }
              }
              if (obj.source && obj.source.issue.pull_request) {
                if (obj.source.issue.state !== 'open') {
                  dangling = false;
                }
              }
            }
            
            if (dangling) {
              this.console.writeLine(bountyModel.shortDescription);
            }
          }
        }
      }
    }
  }
}
DanglingCommand.DESCRIPTION = 'print dangling bounties';


const ConsoleCommands =
  {
    'status': StatusCommand,
    'profile': ProfileCommand,
    'network': NetworkCommand,
    'explore': ExploreCommand,
    'bounty': BountyCommand,
    'visit': VisitCommand,
    'comments': CommentsCommand,
    'echo': EchoCommand,
    'clear': ClearCommand,
    'data': BountyDataCommand,
    'wallet': WalletCommand,
    'fund': FundBountyCommand,
    'payout': PayoutBountyCommand,
    'cancel': CancelBountyCommand,
    'fulfill': FulfillBountyCommand,
    'env': EnvironmentCommand,
    'tts': TextToSpeechCommand,
    'eval': EvalCommand,
    'dangling': DanglingCommand,
    'help': HelpCommand
  };
