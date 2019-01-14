
class BountyCommand {
  constructor(cmd, args, console) {
    this.console = console;

    if (!args.length) {
      console.writeLine(this.constructor.DESCRIPTION);
      return;
    }

    BountyModel.load(args[0], console.network, this.onLoad, this);
  }

  onLoad(bounty) {
    this.console.write(bounty.fullDescription);
  }
}
BountyCommand.DESCRIPTION = '<bounty number>';
this.BountyCommand = BountyCommand;


class BountyDataCommand {
  constructor(cmd, args, console) {
    BountyModel.load(args[0], console.network, console.log, console);
  }
}
BountyDataCommand.DESCRIPTION = '<bounty number>\n\tdump bounty data to console';
this.BountyDataCommand = BountyDataCommand;


class FundBountyCommand {
  constructor(cmd, args, console) {
    const schema = new BountySchema();

    this.schema = schema;
    this.addrs = [];
    this.fields = ['url', 'title', 'description', 'githubUsername'];

    this.setCurrentField(console);
  }

  getWallet(console) {
    console.writeLine('Fetching wallet accounts');
    this.addrs = [];

    const self = this;

    console.web3Wallet.listAccounts().then(
      function(res) {
        if (!res || !res.length) {
          console.writeLine('No accounts. Did you unlock your wallet?\nHit Enter to try again.');
          return;
        }

        while (res.length) {
          let addr = res.pop();
          console.web3Wallet.getBalance(addr).then(
            function(balance) {
              let pos = self.addrs.push(addr) - 1;
              console.writeLine('[' + pos + '] ' + addr + ' | ' + ethers.utils.formatUnits(balance, 'ether'));
            }
          );
        }
        console.writeLine('Enter your [choice]');
      }
    );
  }

  setCurrentField(console) {
    this.currentField = this.fields.shift();

    if (!this.currentField) {
      this.getWallet(console);
      return;
    }

    console.writeLine('Please enter ' + this.currentField);
  }

  askConfirm(console) {
    let expires = ~~((Date.now() / 1000) + (3600));
    this.schema.expireDate = expires;
    this.ready = true;

    console.log(this.schema);
    console.writeLine('Amount: ' + this.amount + ' ETH');
    console.log('Proceed? Enter Yes or No');
  }

  onIpfsPush(res) {
    let console = this.console;
    if (!res || !res['Hash']) {
      console.writeLine('ipfs error');
      return;
    }

    console.log(res);

    let ipfsHash = res['Hash'];
    let arbiter = '0x0000000000000000000000000000000000000000';
    let paysTokens = false;
    let tokenAddress = this.schema.tokenAddress;
    let ethAmount = ethers.utils.parseEther(this.amount.toString());
    let account = this.schema.issuerAddress;

    const signer = this.console.web3Wallet.getSigner();
    const contract = StandardBountyContract.getContract(this.console.network).connect(signer);

    this.done = true;

    contract.issueAndActivateBounty(
      account,
      this.schema.expireDate,
      ipfsHash,
      ethAmount,
      arbiter,
      paysTokens,
      tokenAddress,
      ethAmount,
      {
        // 'from': account,
        'value': ethAmount,
        'gasLimit': 318730
      }
    ).then(
      function(tx) {
        console.log(tx);
        tx.wait().then(
          function(res) {
            console.log(res);
          }
        );
      }
    ).catch(
      function(res) {
        console.log(res.toString());
      }
    );
  }

  onInput(str, console) {
    if (this.done) {
      return;
    }

    if (!this.currentField) {
      if (!this.schema.issuerAddress) {
        let addrChoice = parseInt(str);
        let addr = this.addrs[addrChoice];

        if (!addr) {
          this.getWallet(console);
          return true;
        }

        this.schema.issuerAddress = addr;

        // trigger next steps
        this.onInput('', console);

        return true;
      }

      if (!this.amount) {
        let amount = parseFloat(str);
        if (!amount) {
          console.writeLine('Enter the funding amount in ETH');
          return true;
        }

        this.amount = amount;
        this.askConfirm(console);

        return true;
      }

      if (!this.ready) {
        this.askConfirm(console);
        return true;
      }

      if (str.toLowerCase().indexOf('yes') !== -1) {
        console.writeLine('uploading...');
        this.console = console;
        Ipfs.push(JSON.stringify(this.schema), this.onIpfsPush, this);
        return true;
      }

      console.writeLine('aborted');
      return false;
    }

    this.schema[this.currentField] = str;
    this.setCurrentField(console);

    // need more input ;)
    return true;
  }
}
FundBountyCommand.DESCRIPTION = 'fund a new Issue';
this.FundBountyCommand = FundBountyCommand;


class CancelBountyCommand {
  constructor(cmd, args, console) {
    let bountyId = parseInt(args[0]);

    if (!bountyId) {
      console.writeLine(this.constructor.DESCRIPTION);
      return;
    }

    this.console = console;

    BountyModel.load(bountyId, console.network, this.onLoadBounty, this);
  }

  onLoadBounty(bountyModel) {
    if (!bountyModel) {
      this.console.writeLine('Unknown Bounty. You may have to run `sync` first.');
      return;
    }

    const self = this;
    const signer = this.console.web3Wallet.getSigner();
    const contract = StandardBountyContract.getContract(this.console.network).connect(signer);

    this.console.log('***This must be signed from: ' + bountyModel.issuerAddress + '***');

    contract.killBounty(
      bountyModel.id,
      {
        // 'from': bountyModel.issuerAddress,
        'value': 0,
        'gasLimit': 318730
      }
    ).then(
      function(tx) {
        self.console.log(tx);
        tx.wait().then(
          function(res) {
            self.console.log(res);
          }
        );
      }
    ).catch(
      function(res) {
        self.console.log(res.toString());
      }
    );
  }
}
CancelBountyCommand.DESCRIPTION = '<bounty number>\n\tcancel a bounty';
this.CancelBountyCommand = CancelBountyCommand;


class PayoutBountyCommand {
  constructor(cmd, args, console) {
    this.console = console;
    this.bountyId = parseInt(args[0]);
    this.idToPayout = parseInt(args[1]);

    BountyModel.load(this.bountyId, console.network, this.onLoadBounty, this);
  }

  onLoadBounty(bountyModel) {
    if (!bountyModel) {
      this.console.writeLine('Unknown Bounty. You may have to run `sync` first.');
      return;
    }

    this.console.writeLine(bountyModel.shortDescription);
    this.issuerAddress = bountyModel.issuerAddress;

    let len = bountyModel.fulfillments.length;
    while (len--) {
      const fulfillment = bountyModel.fulfillments[len];
      if (fulfillment.accepted) {
        continue;
      }

      let payload = (fulfillment.ipfsBlob || {}).payload;
      this.console.write('[' + fulfillment.id + ']=');
      this.console.log(fulfillment);

      if (fulfillment.id === this.idToPayout) {
        this.payout(fulfillment.id);
      }
    }
  }

  payout(id) {
    this.console.log('Payout Fulfillment ' + id + ' for Bounty ' + this.bountyId);
    this.console.log('***This must be signed from: ' + this.issuerAddress + '***');

    const self = this;
    const signer = this.console.web3Wallet.getSigner();
    const contract = StandardBountyContract.getContract(this.console.network).connect(signer);

    contract.acceptFulfillment(
      this.bountyId,
      id,
      {
        // 'from': this.issuerAddress,
        'value': 0,
        'gasLimit': 318730
      }
    ).then(
      function(tx) {
        self.console.log(tx);

        tx.wait().then(
          function(res) {
            self.console.log(res);
          }
        );
      }
    ).catch(
      function(res) {
        self.console.log(res.toString());
      }
    );
  }
}
PayoutBountyCommand.DESCRIPTION = '<bounty number> <fulfillment id(optional)>\n\tpayout a bounty';
this.PayoutBountyCommand = PayoutBountyCommand;


class FulfillBountyCommand {
  constructor(cmd, args, console) {
    this.console = console;

    let bountyId = parseInt(args[0]);
    BountyModel.load(bountyId, console.network, this.onLoadBounty, this);
  }

  onLoadBounty(bountyModel) {
    if (!bountyModel) {
      this.console.writeLine('unknown bounty');
      return;
    }

    this.bountyModel = bountyModel;
    this.addrs = [];
    this.schema = new FulfillmentSchema();
    this.fields = ['githubPRLink', 'githubUsername'];

    this.setCurrentField(this.console);
  }

  getWallet(console) {
    console.writeLine('Fetching wallet accounts');
    this.addrs = [];

    const self = this;

    console.web3Wallet.listAccounts().then(
      function(res) {
        if (!res || !res.length) {
          console.writeLine('No accounts. Did you unlock your wallet?\nHit Enter to try again.');
          return;
        }

        while (res.length) {
          let addr = res.pop();
          console.web3Wallet.getBalance(addr).then(
            function(balance) {
              let pos = self.addrs.push(addr) - 1;
              console.writeLine('[' + pos + '] ' + addr + ' | ' + ethers.utils.formatUnits(balance, 'ether'));
            }
          );
        }
        console.writeLine('Enter your [choice]');
      }
    );
  }

  setCurrentField(console) {
    this.currentField = this.fields.shift();

    if (!this.currentField) {
      this.getWallet(console);
      return;
    }

    console.writeLine('Please enter ' + this.currentField);
  }

  askConfirm(console) {
    this.ready = true;

    this.console.log(this.schema);
    this.console.log('Proceed? Enter Yes or No');
  }

  onIpfsPush(res) {
    if (!res || !res['Hash']) {
      this.console.writeLine('ipfs error');
      return;
    }

    this.console.log(res);
    this.console.writeLine('signing...');

    let ipfsHash = res['Hash'];
    let account = this.schema.fulfillerAddress;

    const signer = this.console.web3Wallet.getSigner();
    const contract = StandardBountyContract.getContract(this.console.network).connect(signer);
    const self = this;

    this.done = true;

    contract.fulfillBounty(
      this.bountyModel.id,
      ipfsHash,
      {
        // 'from': account,
        'value': 0,
        'gasLimit': 318730
      }
    ).then(
      function(tx) {
        self.console.log(tx);
        tx.wait().then(
          function(res) {
            self.console.log(res);
          }
        );
      }
    ).catch(
      function(res) {
        self.console.log(res.toString());
      }
    );
  }

  onInput(str, console) {
    if (this.done) {
      return false;
    }

    if (!this.currentField) {
      if (!this.schema.fulfillerAddress) {
        let addrChoice = parseInt(str);
        let addr = this.addrs[addrChoice];

        if (!addr) {
          this.getWallet(console);
          return true;
        }

        this.schema.fulfillerAddress = addr;
        this.askConfirm(console);

        return true;
      }

      if (!this.ready) {
        this.askConfirm(console);
        return true;
      }

      if (str.toLowerCase().indexOf('yes') !== -1) {
        console.writeLine('uploading...');
        Ipfs.push(JSON.stringify(this.schema), this.onIpfsPush, this);
        return true;
      }

      console.writeLine('aborted');
      return false;
    }

    this.schema[this.currentField] = str;
    this.setCurrentField(console);

    // need more input ;)
    return true;
  }
}
FulfillBountyCommand.DESCRIPTION = '<bounty number>\n\tfulfill a bounty';
this.FulfillBountyCommand = FulfillBountyCommand;
