declare module 'passport-apple' {
  export class Strategy {
    constructor(options?: any, verify?: (...args: any[]) => any);
  }
}

declare module 'passport-discord' {
  export class Strategy {
    constructor(options?: any, verify?: (...args: any[]) => any);
  }
}

declare module 'passport-github2' {
  export class Strategy {
    constructor(options?: any, verify?: (...args: any[]) => any);
  }
}

declare module 'passport-twitter' {
  export class Strategy {
    constructor(options?: any, verify?: (...args: any[]) => any);
  }
}

declare module 'passport-facebook' {
  export class Strategy {
    constructor(options?: any, verify?: (...args: any[]) => any);
  }
}

type VerifyCallback = (err: any, user?: any, info?: any) => void;
