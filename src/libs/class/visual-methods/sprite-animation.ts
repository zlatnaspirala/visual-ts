import { ISpriteShema } from "../../interface/global";
import IVisualComponent from "../../interface/visual-component";
import { Counter, getDistance } from "../math";
import Resources from "../resources";
import TextureComponent from "./texture";

/**
 * @description Class SpriteTextureComponent extends TextureComponent and override
 * main method drawComponent. We need to keep tiles system working!
 * Objective:
 * Store and manipulate with image texture data.
 * Render element
 * Tile
 * flip
 *
 * void ctx.drawImage(image, sx, sy, sWidth, sHeight, dx, dy, dWidth, dHeight);
 * JavaScript syntax: context.drawImage(img,sx,sy,swidth,sheight,x,y,width,height);
 * Parameter Values
 * Parameter Description Play it
 * img Specifies the image, canvas, or video element to use
 * sx Optional. The x coordinate where to start clipping
 * sy Optional. The y coordinate where to start clipping
 * swidth	Optional. The width of the clipped image
 * sheight Optional. The height of the clipped image
 * x The x coordinate where to place the image on the canvas
 * y The y coordinate where to place the image on the canvas
 * width Optional. The width of the image to use (stretch or reduce the image)
 * height Optional. The height of the image to use (stretch or reduce the image)
 */
class SpriteTextureComponent extends TextureComponent {

  // Override - TextureComponent
  public keepAspectRatio: boolean = true;

  protected shema: { byX: number, byY: number };
  protected seqFrameX: Counter;
  protected seqFrameY: Counter;

  constructor(name: string, imgRes: string | string[], shema: ISpriteShema) {

    super(name, imgRes);
    this.shema = shema;
    const localSumX = shema.byX - 1;
    const localSumY = shema.byY - 1;
    this.seqFrameX = new Counter(0, localSumX, 1);
    this.seqFrameY = new Counter(0, localSumY, 1);
    this.seqFrameX.setDelay(10);
    this.seqFrameY.onRepeat = this.nextColumn;
    this.seqFrameX.onRepeat = this.nextRow;

    // Override right here to prepare for spritesheet scenario of image drawing.
    (this.flipImage as any) = function (image, ctx, sx, sy, sw, sh, dx, dy, dw, dh, flipH, flipV) {
      const scaleH = flipH ? -1 : 1, scaleV = flipV ? -1 : 1;
      ctx.save();
      ctx.scale(scaleH, scaleV);
      ctx.drawImage(
        this.assets.getImg(), sx, sy, sw, sh, dx, dy, dw, dh);
      ctx.restore();
    };

  }

  /**
   * @description It is not just set up xhema.byX, we need
   * to reconstruct sequencer this.seqFrameX - his job is to
   * to count frames by horisontal.
   * @param byX It is the number for sprite by horisontal
   * devine `img.width / x` operation.
   */
  public setNewShemaByX(byX: number): void {
    this.shema.byX = byX;
    const localSumX = this.shema.byX - 1;
    this.seqFrameX = new Counter(0, localSumX, 1);
    this.seqFrameY.onRepeat = this.nextColumn;
    this.seqFrameX.onRepeat = this.nextRow;
  }

  /**
   * @description It is not just set up xhema.byY, we need
   * to reconstruct sequencer this.seqFrameY - his job is to
   * to count frames by vertical.
   * @param byX It is the number for sprite by horisontal
   * devine `img.height / y` operation.
   */
  public setNewShemaByY(byY: number): void {
    this.shema.byY = byY;
    const localSumY = this.shema.byY - 1;
    this.seqFrameY = new Counter(0, localSumY, 1);
    this.seqFrameY.onRepeat = this.nextColumn;
    this.seqFrameX.onRepeat = this.nextRow;
  }

  /**
   * New shema by x and y factor.
   * @param shema Type of ISpriteShema
   */
  public setNewShema(shema: any): void {
    this.setNewShemaByX(shema.spriteTile[shema.spriteTileCurrent].byX);
    this.setNewShemaByY(shema.spriteTile[shema.spriteTileCurrent].byY);
  }

  /**
   * @description Override function drawComponent
   * from TextureComponent parent class.
   */
  public drawComponent(c: CanvasRenderingContext2D, part: any): void {

    if (this.keepAspectRatio === true) {

      const dist2 = getDistance(part.vertices[part.vertices.length / 2], part.vertices[part.vertices.length - 1]);
      const dist1 = getDistance(part.vertices[0], part.vertices[part.vertices.length / 2 - 1]);
      const originW = dist1 / this.verticalTiles * part.render.sprite.xScale;
      const originH = dist2 / this.horizontalTiles * part.render.sprite.yScale;
      let originX = dist1 * -part.render.sprite.xOffset * part.render.sprite.xScale;
      let originY = dist2 * -part.render.sprite.yOffset * part.render.sprite.yScale;
      originX = originX / this.verticalTiles - originW / 2;
      originY = originY / this.horizontalTiles - originH / 2;

      for (let x = -this.verticalTiles / 2; x < this.verticalTiles / 2; x++) {
        for (let j = -this.horizontalTiles / 2; j < this.horizontalTiles / 2; j++) {

          const sx = this.seqFrameX.getValue() * this.assets.getImg().width / this.shema.byX;
          const sy = this.seqFrameY.getRawValue() * this.assets.getImg().height / this.shema.byY;
          const sw = (this.assets.getImg().width) / this.shema.byX;
          const sh = (this.assets.getImg().height) / this.shema.byY;
          const dx = originX - originW * (x);
          const dy = originY - originH * (j);
          const dw = originW;
          const dh = originH;

          (this.flipImage as any)(this.assets.getImg(),
            c, sx, sy, sw, sh, dx, dy, dw, dh,
            this.horizontalFlip, this.verticalFlip);

        }

      }
    } else {

      const sx = this.seqFrameX.getValue() * this.assets.getImg().width / this.shema.byX;
      const sy = this.seqFrameY.getRawValue() * this.assets.getImg().height / this.shema.byY;
      const sw = (this.assets.getImg().width) / this.shema.byX;
      const sh = (this.assets.getImg().height) / this.shema.byY;
      const dx = (this.assets.getImg().width * -part.render.sprite.xOffset * part.render.sprite.xScale);
      const dy = (this.assets.getImg().height * -part.render.sprite.yOffset * part.render.sprite.yScale);
      const dw = (this.assets.getImg().width * part.render.sprite.xScale);
      const dh = (this.assets.getImg().height * part.render.sprite.yScale);

      c.drawImage(
        this.assets.getImg(), sx, sy, sw, sh, dx, dy, dw, dh);
    }

  }

  private nextRow = () => {
    this.seqFrameY.setDelay(-1);
    this.seqFrameY.getValue();
  }

  private nextColumn() {
    // test
  }

}
export default SpriteTextureComponent;
