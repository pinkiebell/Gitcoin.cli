
class GitcoinConsole extends Console {
  constructor(root) {
    super(root);

    this.web3Wallet = new Web3();

    const self = this;

    if (typeof web3 === 'undefined') {
      window.addEventListener('message', function(evt) {
        var data = evt.data;
        if (data && data.type === 'ETHEREUM_PROVIDER_SUCCESS') {
          self.walletProvider = ethereum;
        }
      }, false);
      window.postMessage({ type: 'ETHEREUM_PROVIDER_REQUEST' }, '*');
    } else {
      this.walletProvider = web3.currentProvider;
    }

    LocalStorage.lookup('env', this.onLookupSettings, this);
    Scheduler.dispatch(this.fetchBlockInfo, 1000, [this]);
  }

  fetchBlockInfo() {
    Scheduler.dispatch(this.fetchBlockInfo, 30000, [this]);

    if (!this.env.network) {
      return;
    }

    const self = this;

    StandardBountyContract.getWeb3ForNetwork(this.env.network).eth.getBlockNumber(
      function(err, res) {
        self.maybeSync(res);
      }
    );
  }

  maybeSync(blockHeight) {
    if (this.bountyNum > 0) {
      return;
    }

    let lastHeight = this.env.blockHeight | 0;

    if (blockHeight - lastHeight > 100) {
      this.env.blockHeight = blockHeight;
      this.startSync();
    }
  }

  startSync() {
    StandardBountyContract.getNumBounties(this.network, this.onGetNumBounties, this);
  }

  onGetNumBounties(res) {
    this.bountyNum = parseInt(res);
    LocalStorage.commit(this.network + 'bounties', this.bountyNum);

    this.syncNextBounty();
  }

  syncNextBounty() {
    if (this.bountyNum > 0) {
      Scheduler.dispatch(this.syncNextBounty, 100, [this]);

      let model = BountyModel.load(--this.bountyNum, this.network);
      model.updateBountyData(this.env.blockHeight);
      model.fetchComments(this.env.blockHeight);
    }
  }

  saveEnv() {
    LocalStorage.commit('env', this.env);
  }

  get network() {
    return this.env.network;
  }

  set network(val) {
    if (!StandardBountyContract.getAddress(val)) {
      this.writeLine('Unsupported Network `' + val + '`');
      return;
    }

    this.bountyNum = 0;
    if (val !== this.env.network) {
      this.env.blockHeight = 0;
    }

    this.web3Wallet.setProvider(this.walletProvider);
    this.env.network = val;
    this.saveEnv();
  }

  applyEnv() {
    this.env.red = this.env.red || 'rgb(235, 77, 98)';
    this.env.green = this.env.green || 'rgb(24, 188, 156)';
    this.env.orange = this.env.orange || 'rgb(255, 216, 218)';
    this.env.blue = this.env.blue || 'rgb(69, 173, 213)';
    this.env.magenta = this.env.magenta || 'rgb(199, 89, 155)';
    this.env.bgColor = this.env.bgColor || 'rgb(41, 51, 61)';
    this.env.network = this.env.network || 'mainnet';

    this.bgColor = this.env.bgColor;
    this.network = this.env.network;

    if (this.env.githubToken) {
      Github.TOKEN = this.env.githubToken;
    }
  }

  onLookupSettings(res) {
    res = res || {};

    this.env = res;

    this.applyEnv();

    this.write('Welcome to Gitcoin.cli\n');
    this.write(
      '  __\n' +
      ' /****\\   \\O/    o(O)o   ****   (* *)  (c)  |.^.^.|\n' +
      '/****_  - |*| -  /{ }\\  **      /~.~\\  (o)  |  ^  |\n' +
      '\\*****|   |*|     | |   **     (/   \\) (i)  |     |\n' +
      ' \\****|  _/ \\_    \\_\\_   ****   (_ _)  (n)  |     |\n\n');

    this.write('Enter \'help\' for robot assistance.\n');
    this.write('Setup a Github token (env githubToken=TOKEN)\n');

    if (this.env.canSpeak === undefined) {
      this.env.canSpeak = true;
      this.dispatchCommand('tts', []);
    }
  }

  dispatchCommand(command, args) {
    if (command) {
      const handler = ConsoleCommands[command];
      if (handler) {
        const cmd= new handler(command, args, this);
        if (cmd.onInput) {
          this.activeCommand = cmd;
        }
        return;
      }
      this.write('No such thing.\n');
    }
  }
}
