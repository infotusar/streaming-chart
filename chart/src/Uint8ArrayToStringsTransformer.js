/**
 * This transformer takes binary Uint8Array chunks from a `fetch`
 * and translates them to chunks of strings.
 *
 * @implements {TransformStreamTransformer}
 */
class Uint8ArrayToStringsTransformer {
    constructor() {
      this.decoder = new TextDecoder();
      this.lastString = '';
    }
  
    /**
     * Receives the next Uint8Array chunk from `fetch` and transforms it.
     *
     * @param {Uint8Array} chunk The next binary data chunk.
     * @param {TransformStreamDefaultController} controller The controller to enqueue the transformed chunks to.
     */
    transform(chunk, controller) {

      if(chunk !== null && chunk.length > 0){
        // Decode the current chunk to string and prepend the last string
        const string = `${this.lastString}${this.decoder.decode(chunk)}`;
    
        // Extract lines from chunk
        const lines = string.split(/\r\n|[\r\n]/g);
        
        // delete file's header
        if(lines[0].includes('Last')){
          lines.shift();
        }

        // Save last line, as it might be incomplete
        this.lastString = lines.pop() || '';
        
        // enqueue data
        controller.enqueue(lines);
      }

    }
  
    /**
     * Is called when `fetch` has finished writing to this transform stream.
     *
     * @param {TransformStreamDefaultController} controller The controller to enqueue the transformed chunks to.
     */
    flush(controller) {
      // Is there still a line left? Enqueue it
      if (this.lastString) {
        controller.enqueue((typeof this.lastString === 'string') ? [this.lastString] : this.lastString);
      }
    }
}