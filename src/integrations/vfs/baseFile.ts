export class BaseFile {
  public type = "base"
  public content = ""
  public change = true // set it to false after external processing
  constructor(public filename: string) {}

  toString() {
    return this.content
  }
}
