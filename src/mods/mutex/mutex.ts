import { Clone, Deferred, Ref } from "@hazae41/box"
import { Future } from "@hazae41/future"
import { Awaitable } from "libs/awaitable/index.js"
import { Nullable } from "libs/nullable/index.js"

export class LockedError extends Error {
  readonly #class = LockedError
  readonly name = this.#class.name

  constructor() {
    super("Locked")
  }

}

/**
 * A limited counter
 */
export class Semaphore<T, N extends number = number> {

  #queue = new Array<Future<void>>()

  #count = 0

  constructor(
    readonly value: T,
    readonly limit: N
  ) { }

  [Symbol.dispose](this: Semaphore<Disposable, N>) {
    this.value[Symbol.dispose]()
  }

  async [Symbol.asyncDispose](this: Semaphore<AsyncDisposable, N>) {
    await this.value[Symbol.asyncDispose]()
  }

  get count() {
    return this.#count
  }

  get locked() {
    return this.#count >= this.limit
  }

  #unlock() {
    this.#count--
    this.#queue.shift()?.resolve()
  }

  get() {
    return this.value
  }

  getOrNull(): Nullable<T> {
    if (this.#count >= this.limit)
      return
    return this.value
  }

  getOrThrow(): T {
    if (this.#count >= this.limit)
      throw new LockedError()
    return this.value
  }

  async wait() {
    this.#count++

    if (this.#count > this.limit) {
      const future = new Future<void>()
      this.#queue.push(future)
      await future.promise
    }

    this.#unlock()
  }

  lockOrNull(): Nullable<Ref<T>> {
    if (this.#count >= this.limit)
      return

    this.#count++

    return new Ref(this.value, new Deferred(() => this.#unlock()))
  }

  /**
   * Get and lock or throw
   * @returns 
   */
  lockOrThrow(): Ref<T> {
    if (this.#count >= this.limit)
      throw new LockedError()

    this.#count++

    return new Ref(this.value, new Deferred(() => this.#unlock()))
  }

  /**
   * Get and lock or wait
   * @returns 
   */
  async lockOrWait(): Promise<Ref<T>> {
    this.#count++

    if (this.#count > this.limit) {
      const future = new Future<void>()
      this.#queue.push(future)
      await future.promise
    }

    return new Ref(this.value, new Deferred(() => this.#unlock()))
  }

  /**
   * @deprecated
   * @param callback 
   * @returns 
   */
  async runOrThrow<R>(callback: (value: T) => Awaitable<R>): Promise<R> {
    if (this.#count >= this.limit)
      throw new LockedError()

    this.#count++

    try {
      return await callback(this.value)
    } finally {
      this.#unlock()
    }
  }

  /**
   * @deprecated
   * @param callback 
   * @returns 
   */
  async runOrWait<R>(callback: (value: T) => Awaitable<R>): Promise<R> {
    this.#count++

    if (this.#count > this.limit) {
      const future = new Future<void>()
      this.#queue.push(future)
      await future.promise
    }

    try {
      return await callback(this.value)
    } finally {
      this.#unlock()
    }
  }

}

/**
 * A semaphore but with a limit of 1
 */
export class Mutex<T> {

  #queue = new Array<Future<void>>()

  #count = 0

  constructor(
    readonly value: T
  ) { }

  [Symbol.dispose](this: Mutex<Disposable>) {
    this.value[Symbol.dispose]()
  }

  async [Symbol.asyncDispose](this: Mutex<AsyncDisposable>) {
    await this.value[Symbol.asyncDispose]()
  }


  get count() {
    return this.#count
  }

  get locked() {
    return this.#count >= 1
  }

  #unlock() {
    this.#count--
    this.#queue.shift()?.resolve()
  }

  get() {
    return this.value
  }

  getOrNull(): Nullable<T> {
    if (this.#count >= 1)
      return
    return this.value
  }

  getOrThrow(): T {
    if (this.#count >= 1)
      throw new LockedError()
    return this.value
  }

  async wait() {
    this.#count++

    if (this.#count > 1) {
      const future = new Future<void>()
      this.#queue.push(future)
      await future.promise
    }

    this.#unlock()
  }

  lockOrNull(): Nullable<Ref<T>> {
    if (this.#count >= 1)
      return

    this.#count++

    return new Ref(this.value, new Deferred(() => this.#unlock()))
  }

  /**
   * Get and lock or throw
   * @returns 
   */
  lockOrThrow(): Ref<T> {
    if (this.#count >= 1)
      throw new LockedError()

    this.#count++

    return new Ref(this.value, new Deferred(() => this.#unlock()))
  }

  /**
   * Get and lock or wait
   * @returns 
   */
  async lockOrWait(): Promise<Ref<T>> {
    this.#count++

    if (this.#count > 1) {
      const future = new Future<void>()
      this.#queue.push(future)
      await future.promise
    }

    return new Ref(this.value, new Deferred(() => this.#unlock()))
  }

  /**
   * @deprecated
   * @param callback 
   * @returns 
   */
  async runOrThrow<R>(callback: (value: T) => Awaitable<R>): Promise<R> {
    if (this.#count >= 1)
      throw new LockedError()

    this.#count++

    try {
      return await callback(this.value)
    } finally {
      this.#unlock()
    }
  }

  /**
   * @deprecated
   * @param callback 
   * @returns 
   */
  async runOrWait<R>(callback: (value: T) => Awaitable<R>): Promise<R> {
    this.#count++

    if (this.#count > 1) {
      const future = new Future<void>()
      this.#queue.push(future)
      await future.promise
    }

    try {
      return await callback(this.value)
    } finally {
      this.#unlock()
    }
  }

  static cloneAndLockOrNull<T extends Disposable>(mutex: Clone<Mutex<T>>) {
    const locked = mutex.get().lockOrNull()

    if (locked == null)
      return

    const cloned = mutex.clone()

    const dispose = () => {
      using _cloned = cloned
      using _locked = locked
    }

    return new Ref(locked.get(), new Deferred(dispose))
  }

  static cloneAndLockOrThrow<T extends Disposable>(mutex: Clone<Mutex<T>>) {
    const cloned = mutex.clone()
    const locked = cloned.get().lockOrThrow()

    const dispose = () => {
      using _cloned = cloned
      using _locked = locked
    }

    return new Ref(locked.get(), new Deferred(dispose))
  }

  static async cloneAndLockOrWait<T extends Disposable>(mutex: Clone<Mutex<T>>): Promise<Ref<T>> {
    const cloned = mutex.clone()
    const locked = await cloned.get().lockOrWait()

    const dispose = () => {
      using _cloned = cloned
      using _locked = locked
    }

    return new Ref(locked.get(), new Deferred(dispose))
  }

}