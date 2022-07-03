export class BaseFile {
  public content = ''
  public suffix = ''
  public change = true // set it to false after external processing
  constructor(public filename: string) {}

  toString() {
    return this.content
  }
}
