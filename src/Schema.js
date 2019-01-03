
class MetaSchema {
  constructor() {
    this['platform'] = 'gitcoin';
    this['schemaVersion'] = '0.1';
    this['schemaName'] = 'gitcoinBounty';
  }
}

// for standard and gitcoin
class PersonaSchema {
  constructor() {
    this['name'] = '';
    this['email'] = '';
    this['githubUsername'] = '';
    this['address'] = '';
  }
}

class BountySchema {
  constructor() {
  
    this['payload'] = {};
    this['payload']['title'] = '';
    this['payload']['description'] = '';
    this['payload']['issuer'] = new PersonaSchema();
    this['payload']['funders'] = [];
    this['payload']['categories'] = [];
    //in seconds
    this['payload']['created'] = ~~(Date.now() / 1000).toString();
    this['payload']['webReferenceURL'] = '';
    this['payload']['tokenName'] = 'ETH';
    // 0x0 if eth
    this['payload']['tokenAddress'] = '0x0000000000000000000000000000000000000000';
    // IPFS
    this['payload']['sourceFileName'] = '';
    this['payload']['sourceFileHash'] = '';
    this['payload']['sourceDirectoryHash'] = '';

    this['payload']['expire_date'] = 0;

    this['payload']['hiring'] = {};
    this['payload']['hiring']['jobDescription'] = '';

    this['payload']['schemes'] = {};
    this['payload']['schemes']['project_type'] = 'traditional';
    this['payload']['schemes']['permission_type'] = 'permissionless';

    this['meta'] = new MetaSchema();
  }

  set url(val) {
    this['payload']['webReferenceURL'] = val;
  }

  set title(val) {
    this['payload']['title'] = val;
  }

  set description(val) {
    this['payload']['description'] = val;
  }

  set githubUsername(val) {
    this['payload']['issuer']['githubUsername'] = val;
  }

  get issuerAddress() {
    return this['payload']['issuer']['address'];
  }

  set issuerAddress(val) {
    this['payload']['issuer']['address'] = val;
  }

  get tokenAddress() {
    return this['payload']['tokenAddress'];
  }

  set tokenAddress(val) {
    this['payload']['tokenAddress'] = val;
  }

  get tokenName() {
    return this['payload']['tokenName'];
  }

  set tokenName(val) {
    this['payload']['tokenName'] = val;
  }

  get expireDate() {
    return this['payload']['expire_date'];
  }

  set expireDate(val) {
    this['payload']['expire_date'] = val;
  }
}

class FulfillmentSchema {
  constructor() {
    this['payload'] = {};
    this['payload']['description'] = '';

    this['payload']['sourceFileName'] = '';
    this['payload']['sourceFileHash'] = '';
    this['payload']['sourceDirectoryHash'] = '';

    this['payload']['fulfiller'] = new PersonaSchema();

    this['meta'] = new MetaSchema();
    this['meta']['schemaName'] = 'gitcoinFulfillment';
  }

  set description(val) {
    this['payload']['description'] = val;
  }

  set githubPRLink(val) {
    this['payload']['fulfiller']['githubPRLink'] = val;
  }

  set githubUsername(val) {
    this['payload']['fulfiller']['githubUsername'] = val;
  }

  get fulfillerAddress() {
    return this['payload']['fulfiller']['address'];
  }

  set fulfillerAddress(val) {
    this['payload']['fulfiller']['address'] = val;
  }
}
