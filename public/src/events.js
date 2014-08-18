var EventEmitter = {
  events: {},
  on(event, cb) {
    this.events[event] || (this.events[event] = []);
    this.events[event].push(cb);
    return this;
  },
  off() {
    this.events = {}
    return this;
  },
  emit(event, ...args) {
    (this.events[event] || []).forEach(cb => cb.apply(this, args));
    return this;
  }
};
