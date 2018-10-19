
class BountyModel {
  static loadAll(start, network, callback, scope, tmp) {
    if (tmp) {
      let res = tmp[0];

      if (res && res._fullyLoaded) {
        callback.call(scope, tmp.shift(), res.id === start - 1);
      }
      if (tmp.length) {
        Scheduler.dispatch(this.loadAll, 0, [this, start, network, callback, scope, tmp]);
      }
      return;
    }

    if (start === -1) {
      const self = this;

      LocalStorage.lookup(network + 'bounties',
        function(res) {

          Scheduler.dispatch(
            self.loadAll,
            0,
            [self, res ? parseInt(res) : 0, network, callback, scope, tmp]
          );
        },
        this
      );

      return;
    }

    tmp = [];
    let i = -1;

    while (++i < start) {
      tmp.push(this.load(i, network));
    }

    Scheduler.dispatch(this.loadAll, 3, [this, start, network, callback, scope, tmp]);
  }

  static load(id, network, callback, scope) {
    let k = network + id.toString();
    let v = this._CACHE[k];
    if (v) {
      if (callback) {
        Scheduler.dispatch(callback, 0, [scope, v]);
      }
      return v;
    }

    if (!v) {
      v = new this();
      v.id = id;
      v.network = network;

      this._CACHE[k] = v;

      LocalStorage.lookup(k, function(obj) {
        v._updateFrom(obj);
        v._fullyLoaded = true;
        v.save();

        if (callback) {
          callback.call(scope, v);
        }
      }, this);

      return v;
    }
  }

  _updateFrom(obj) {
    //TODO ...
    if (!obj) {
      return;
    }

    const keys = Object.keys(obj);
    while (keys.length) {
      const key = keys.pop();
      let t = this[key];
      if (t === undefined) {
        this[key] = obj[key];
      }
    }
  }

  constructor(obj) {
    if (obj) {
      this._updateFrom(obj);
    }

    this._fullyLoaded = false;
  }

  save() {
    if (!this._fullyLoaded) {
      console.warn('save before fully loaded', this);
      return;
    }

    LocalStorage.commit(this.network + this.id.toString(), this);
  }

  updateBountyData(blockNumber) {
    if (this.blockNumber >= blockNumber) {
      //done
      return;
    }

    if (!this._fullyLoaded) {
      Scheduler.dispatch(this.updateBountyData, 10, [this, blockNumber]);
      return;
    }

    this.blockNumber = blockNumber;

    if (!this.bountyStage) {
      StandardBountyContract.getBountyToken(this.id, this.network, this.onGetBountyToken, this);
      StandardBountyContract.getBountyArbiter(this.id, this.network, this.onGetBountyArbiter, this);
    }

    if (!this.bountyStage || !this.ipfsBlob) {
      this.fetchBountyIpfs();
    }
    StandardBountyContract.getNumFulfillments(this.id, this.network, this.onGetNumFulfillments, this);
    StandardBountyContract.getBounty(this.id, this.network, this.onGetBounty, this);
  }

  onGetBounty(res) {
    if (res) {
      this.issuer = res[0];
      this.deadline = res[1];
      this.fulfillmentAmount = res[2];
      this.paysTokens = res[3];
      this.bountyStage = parseInt(res[4]);
      this.balance = res[5];

      this.save();
    }
  }

  onGetBountyToken(res) {
    if (res) {
      this.token = res;
      this.save();
    }
  }

  onGetBountyArbiter(res) {
    if (res) {
      this.arbiter = res;
      this.save();
    }
  }

  onGetNumFulfillments(res) {
    if (~~res === res) {
      while (res) {
        this.fetchFulfillment(--res, this.blockNumber);
      }
    }
  }

  fetchBountyIpfs(blockNumber) {
    if (!this._fullyLoaded) {
      Scheduler.dispatch(this.fetchBountyIpfs, 10, [this, blockNumber]);
      return;
    }

    StandardBountyContract.getBountyData(this.id, this.network, this.onGetBountyData, this);
  }

  onGetBountyData(res) {
    if (res) {
      if (this.data === res && this.ipfsBlob) {
        return;
      }

      this.data = res;
      this.save();

      Ipfs.pull(this.data, this.onFetchBountyIpfs, this);
    }
  }

  onFetchBountyIpfs(res) {
    if (res) {
      this.ipfsBlob = res;
      this.save();
    }

    this.fetchComments(this.blockNumber);
  }

  fetchFulfillment(fulfillmentId, blockNumber) {
    if (this.fulfillments) {
      const f = this.fulfillments[fulfillmentId];
      if (f && f.ipfsBlob && (f.accepted || f.blockNumber >= blockNumber)) {
        //done
        return;
      }
    }

    if (!this._fullyLoaded) {
      Scheduler.dispatch(this.fetchFulfillment, 10, [this, fulfillmentId, blockNumber]);
      return;
    }

    this.fulfillments = this.fulfillments || [];
    let tmp = this.fulfillments[fulfillmentId] || {};
    tmp.blockNumber = blockNumber;
    this.fulfillments[fulfillmentId] = tmp;

    StandardBountyContract.getFulfillment(this.id, this.network, fulfillmentId, this.onFetchFulfillment, this);
  }

  onFetchFulfillment(res, fid) {
    let scope = this.fulfillments[fid];
    let pullBlob = !scope.ipfsBlob || scope.data !== res[2];

    scope.accepted = res[0];
    scope.fulfiller = res[1];
    scope.data = res[2];
    scope.id = fid;

    this.save();

    if (pullBlob) {
      const self = this;

      Ipfs.pull(scope.data,
        function(ipfsObj) {
          if (ipfsObj) {
            scope.ipfsBlob = ipfsObj;
            self.save();
            return;
          }
        },
        self
      );
    }
  }

  fetchComments(blockNumber) {
    if (this.githubTimeline &&
      (blockNumber - this.githubBlockNumber) < 99) {

      return;
    }

    if (!this._fullyLoaded) {
      Scheduler.dispatch(this.fetchComments, 10, [this, blockNumber]);
      return;
    }

    if (this.url && (!this.githubTimeline || (this.bountyStage === 1 && this.balanceValue > 0))) {
      this.githubBlockNumber = blockNumber;

      Github.fetchTimeline(this.url, this.onFetchComments, this,
        this.githubCommentsETag, this.githubPagination);
    }
  }

  onFetchComments(res, status, ETag, page) {
    if (res && res.length) {
      this.githubTimeline = res;
    }

    this.githubCommentsETag = ETag;
    this.githubPagination = page;
    this.save();
  }

  get gitcoinbotStatus() {
    //if (this._gitcoinbotStatus) {
    //  return this._gitcoinbotStatus;
    //}

    if (!this.githubTimeline) {
      return '';
    }

    let statusDesc = '';
    const len = this.githubTimeline.length;

    for (var i = 0; i < len; i++) {
      const comment = this.githubTimeline[i];
      const user = comment.user || comment.actor;

      if (comment.event !== 'commented' || !user) {
        continue;
      }

      if (user.login === 'gitcoinbot') {
        //Issue Status: 1. **Open** 2. Started 3. Submitted 4. Done 
        let start = comment.body.indexOf('Issue Status:');
        if (start === -1) {
          continue;
        }
        let end = comment.body.indexOf('\n', start);
        if (end === -1) {
          continue;
        }
        let tmp = comment.body.substring(start, end);

        start = tmp.indexOf('**');
        if (start === -1) {
          continue;
        }
        end = tmp.indexOf('**', start += 2);
        if (end === -1) {
          continue;
        }

        statusDesc = tmp.substring(start, end);

        // Inconsistency
        if (comment.body.indexOf('Work has been started') !== -1) {
          statusDesc = 'Started';
        }
      }
    }

    if (statusDesc) {
      this._gitcoinbotStatus = statusDesc;
    }

    return this._gitcoinbotStatus;
  }

  get payload() {
    const ipfsBlob = this.ipfsBlob || {};
    return ipfsBlob.payload || {};
  }

  get meta() {
    const ipfsBlob = this.ipfsBlob || {};
    return ipfsBlob.meta || {};
  }

  get platform() {
    return this.meta.platform || 'unknown';
  }

  get title() {
    return this.payload.title;
  }

  get description() {
    return this.payload.description;
  }

  get tokenAddress() {
    return this.token;
  }

  get tokenValue() {
    return Web3.utils.fromWei(this.fulfillmentAmount || '0');
  }

  get balanceValue() {
    return Web3.utils.fromWei(this.balance || '0');
  }

  get tokenName() {
    if (Tokens[this.network]) {
      let tmp = Tokens[this.network][this.token];
      return tmp ? tmp.sym : this.payload.tokenName;
    }

    return this.payload.tokenName;
  }

  get url() {
    return this.payload.webReferenceURL || '';
  }

  get createdAt() {
    return this.payload.created;
  }

  get _issuer() {
    return this.payload.issuer || {};
  }

  get issuerName() {
    return this._issuer.name;
  }

  get issuerEmail() {
    return this._issuer.email;
  }

  get issuerAddress() {
    return this._issuer.address;
  }

  get issuerUsername() {
    return this._issuer.githubUsername;
  }

  get categories() {
    return this.payload.categories;
  }

  get projectType() {
    if (this.payload.schemes) {
      return this.payload.schemes.project_type;
    }

    return '';
  }

  get permissionType() {
    if (this.payload.schemes) {
      return this.payload.schemes.permission_type;
    }

    return '';
  }

  get status() {
    if (this.bountyStage === 0) {
      return 'Draft';
    }

    if (this.bountyStage === 2) {
      return 'Dead';
    }

    let status = this.gitcoinbotStatus || 'Open';

    if (this.fulfillments) {
      let accepted = false;
      let len = this.fulfillments.length;
      if (len) {
        status = 'Submitted';
      }

      while (len--) {
        let fulfillment = this.fulfillments[len];
        if (fulfillment.accepted) {
          accepted = true;
          if (this.balance == 0) {
            status = 'Done';
          }
        }
      }
    }

    return status;
  }

  get shortDescription() {
    return this.projectType +
      '(' + this.id + ' - ' + this.status + '@' + this.platform + ') ' +
      this.title +
      ' ' +
      '(' +
      (this.issuerUsername || this.issuerName) +
      ') ' +
      this.tokenValue +
      '/' + 
      this.balanceValue +
      ' ' +
      this.tokenName;
  }

  get fullDescription() {
    return '\nProject Type: ' + this.projectType +
      '\nPermission Type: ' + this.permissionType +
      '\nStatus: ' + this.status +
      '\nPlatform: ' + this.platform +
      '\nTitle: ' + this.title +
      '\nFunder: ' + (this.issuerUsername || this.issuerName) +
      '/' + this.issuer +
      '\nToken: ' + this.tokenValue + ' ' + this.tokenName +
      '\nAvailable Balance: ' + this.balanceValue + ' ' + this.tokenName +
      '\nFulfillments: ' + (this.fulfillments ? this.fulfillments.length : 0) +
      '\nDescription: \n' + this.description +
      '\nLink: ' + this.url +
      '\n';
  }
}
BountyModel._CACHE = {};
