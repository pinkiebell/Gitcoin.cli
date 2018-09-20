
class Web3ConnectionPool {
  constructor() {
    this.pools = {};

    Scheduler.dispatch(this.checkConnection, 5000, [this]);
  }

  checkConnection() {
    Scheduler.dispatch(this.checkConnection, 5000, [this]);

    const networks = Object.keys(this.pools);

    while (networks.length) {
      const net = networks.pop();
      const connections = this.pools[net];
      const len = connections.length;

      for (let i = 0; i < len; i++) {
        const web3 = connections[i];
        if (web3.currentProvider.connection.readyState === 3) {
          let oldProvider = web3.currentProvider;

          if (oldProvider) {
            web3.setProvider();
            oldProvider.removeAllListeners()
            oldProvider.connection.close()
          }
          web3.setProvider(new Web3.providers.WebsocketProvider('wss://' + net + '.infura.io/ws'));
        }
      }
    }
  }

  instanceForNetwork(network) {
    var connections = this.pools[network] || [];
    if (!connections.length) {
      const count = 16;

      this.ctr = 0;
      for (var i = 0; i < count; i++) {
        const web3 = new Web3();
        web3.setProvider(new Web3.providers.WebsocketProvider('wss://' + network + '.infura.io/ws'));
        connections.push(web3);
      }
      this.pools[network] = connections;
    }

    return connections[this.ctr++ % connections.length];
  }
}
