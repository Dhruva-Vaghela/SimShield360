export class AsyncLocalStorage {
  constructor() {}
  run(store: any, callback: () => any) {
    return callback();
  }
  getStore() {
    return undefined;
  }
}
