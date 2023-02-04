/*
 * Name          : joy.js
 * @author       : Roberto D'Amico (Bobboteck)
 * Last modified : 09.06.2020
 * Revision      : 1.1.6
 *
 * Modification History:
 * Date         Version     Modified By     Description
 * 2021-12-21   2.0.0       Roberto D'Amico New version of the project that integrates the callback functions, while
 *                                          maintaining compatibility with previous versions. Fixed Issue #27 too,
 *                                          thanks to @artisticfox8 for the suggestion.
 * 2020-06-09   1.1.6       Roberto D'Amico Fixed Issue #10 and #11
 * 2020-04-20   1.1.5       Roberto D'Amico Correct: Two sticks in a row, thanks to @liamw9534 for the suggestion
 * 2020-04-03               Roberto D'Amico Correct: InternalRadius when change the size of canvas, thanks to
 *                                          @vanslipon for the suggestion
 * 2020-01-07   1.1.4       Roberto D'Amico Close #6 by implementing a new parameter to set the functionality of
 *                                          auto-return to 0 position
 * 2019-11-18   1.1.3       Roberto D'Amico Close #5 correct indication of East direction
 * 2019-11-12   1.1.2       Roberto D'Amico Removed Fix #4 incorrectly introduced and restored operation with touch
 *                                          devices
 * 2019-11-12   1.1.1       Roberto D'Amico Fixed Issue #4 - Now JoyStick work in any position in the page, not only
 *                                          at 0,0
 *
 * The MIT License (MIT)
 *
 *  This file is part of the JoyStick Project (https://github.com/bobboteck/JoyStick).
 *	Copyright (c) 2015 Roberto D'Amico (Bobboteck).
 *
 * Permission is hereby granted, free of charge, to any person obtaining a copy
 * of this software and associated documentation files (the "Software"), to deal
 * in the Software without restriction, including without limitation the rights
 * to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
 * copies of the Software, and to permit persons to whom the Software is
 * furnished to do so, subject to the following conditions:
 *
 * The above copyright notice and this permission notice shall be included in all
 * copies or substantial portions of the Software.
 *
 * THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
 * IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
 * FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
 * AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
 * LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
 * OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE
 * SOFTWARE.
 */
export default class JoyStick {
    constructor(objContainer, configuration) {
        this.StickStatus = {
            xPosition: 0,
            yPosition: 0,
            x: 0,
            y: 0,
            cardinalDirection: "C",
        };
        this.parameters = configuration?.parameters || {};
        const defaultConfig = {
            title: "joystick",
            width: 0,
            height: 0,
            internalFillColor: "#00AA00",
            internalLineWidth: 2,
            internalStrokeColor: "#003300",
            externalLineWidth: 2,
            externalStrokeColor: "#008000",
            autoReturnToCenter: true,
            callback: function (StickStatus) { },
        };
        this.callback = configuration?.callback || defaultConfig.callback;
        this.title = configuration?.parameters?.title || defaultConfig.title;
        this.width = configuration?.parameters?.width || defaultConfig.width;
        this.height = configuration?.parameters?.height || defaultConfig.height;
        this.internalFillColor =
            configuration?.parameters?.internalFillColor ||
                defaultConfig.internalFillColor;
        this.internalLineWidth =
            configuration?.parameters?.internalLineWidth ||
                defaultConfig.internalLineWidth;
        this.internalStrokeColor =
            configuration?.parameters?.internalStrokeColor ||
                defaultConfig.internalStrokeColor;
        this.externalLineWidth =
            configuration?.parameters?.externalLineWidth ||
                defaultConfig.externalLineWidth;
        this.externalStrokeColor =
            configuration?.parameters?.externalStrokeColor ||
                defaultConfig.externalStrokeColor;
        this.autoReturnToCenter =
            configuration?.parameters?.autoReturnToCenter ||
                defaultConfig.autoReturnToCenter;
        console.log('stttt', objContainer.style);
        objContainer.style.touchAction = "none";
        this.canvas = document.createElement("canvas");
        this.canvas.id = this.title;
        if (this.width === 0) {
            this.width = objContainer.clientWidth;
        }
        if (this.height === 0) {
            this.height = objContainer.clientHeight;
        }
        this.canvas.width = this.width;
        this.canvas.height = this.height;
        objContainer.appendChild(this.canvas);
        const ctx = this.canvas.getContext("2d");
        console.log('canvas', ctx);
        this.context = ctx;
        this.pressed = false; // Bool - 1=Yes - 0=No
        this.circumference = 2 * Math.PI;
        this.internalRadius =
            (this.canvas.width - (this.canvas.width / 2 + 10)) / 2;
        this.maxMoveStick = this.internalRadius * 1.1;
        this.externalRadius = this.internalRadius * 1.5;
        this.centerX = this.canvas.width / 2;
        this.centerY = this.canvas.height / 2;
        this.directionHorizontalLimitPos = this.canvas.width / 10;
        this.directionHorizontalLimitNeg = this.directionHorizontalLimitPos * -1;
        this.directionVerticalLimitPos = this.canvas.height / 10;
        this.directionVerticalLimitNeg = this.directionVerticalLimitPos * -1;
        // Used to save current position of stick
        this.movedX = this.centerX;
        this.movedY = this.centerY;
        // Check if the device support the touch or not
        if ("ontouchstart" in document.documentElement) {
            this.canvas.addEventListener("touchstart", (e) => this._onTouchStart(e), false);
            document.addEventListener("touchmove", (e) => this._onTouchMove(e), false);
            document.addEventListener("touchend", (e) => this._onTouchEnd(e), false);
        }
        else {
            this.canvas.addEventListener("mousedown", (e) => this._onMouseDown(e), false);
            document.addEventListener("mousemove", (e) => this._onMouseMove(e), false);
            document.addEventListener("mouseup", (e) => this._onMouseUp(e), false);
        }
        // Draw the object
        this._drawExternal();
        this._drawInternal();
    }
    /**
     * @desc Draw the external circle used as reference position
     */
    _drawExternal() {
        this.context.beginPath();
        this.context.arc(this.centerX, this.centerY, this.externalRadius, 0, this.circumference, false);
        this.context.lineWidth = this.externalLineWidth;
        this.context.strokeStyle = this.externalStrokeColor;
        this.context.stroke();
    }
    /**
     * @desc Draw the internal stick in the current position the user have moved it
     */
    _drawInternal() {
        this.context.beginPath();
        if (this.movedX < this.internalRadius) {
            this.movedX = this.maxMoveStick;
        }
        if (this.movedX + this.internalRadius > this.canvas.width) {
            this.movedX = this.canvas.width - this.maxMoveStick;
        }
        if (this.movedY < this.internalRadius) {
            this.movedY = this.maxMoveStick;
        }
        if (this.movedY + this.internalRadius > this.canvas.height) {
            this.movedY = this.canvas.height - this.maxMoveStick;
        }
        this.context.arc(this.movedX, this.movedY, this.internalRadius, 0, this.circumference, false);
        // create radial gradient
        const grd = this.context.createRadialGradient(this.centerX, this.centerY, 5, this.centerX, this.centerY, 200);
        // Light color
        grd.addColorStop(0, this.internalFillColor);
        // Dark color
        grd.addColorStop(1, this.internalStrokeColor);
        this.context.fillStyle = grd;
        this.context.fill();
        this.context.lineWidth = this.internalLineWidth;
        this.context.strokeStyle = this.internalStrokeColor;
        this.context.stroke();
    }
    /**
     * @desc Events for manage touch
     */
    _onTouchStart(event) {
        this.pressed = true;
    }
    _onTouchMove(event) {
        if (this.pressed && event.targetTouches[0].target === this.canvas) {
            this.movedX = event.targetTouches[0].pageX;
            this.movedY = event.targetTouches[0].pageY;
            // Manage offset
            if (this.canvas.offsetParent.tagName.toUpperCase() === "BODY") {
                this.movedX -= this.canvas.offsetLeft;
                this.movedY -= this.canvas.offsetTop;
            }
            else {
                this.movedX -= this.canvas.offsetParent.offsetLeft;
                this.movedY -= this.canvas.offsetParent.offsetTop;
            }
            // Delete canvas
            this.context.clearRect(0, 0, this.canvas.width, this.canvas.height);
            // Redraw object
            this._drawExternal();
            this._drawInternal();
            // Set attribute of callback
            this.StickStatus.xPosition = this.movedX;
            this.StickStatus.yPosition = this.movedY;
            this.StickStatus.x = Number((100 * ((this.movedX - this.centerX) / this.maxMoveStick)).toFixed());
            this.StickStatus.y = Number((100 *
                ((this.movedY - this.centerY) / this.maxMoveStick) *
                -1).toFixed());
            this.StickStatus.cardinalDirection = this._getCardinalDirection();
            this.callback(this.StickStatus);
        }
    }
    _onTouchEnd(event) {
        this.pressed = false;
        // If required reset position store variable
        if (this.autoReturnToCenter) {
            this.movedX = this.centerX;
            this.movedY = this.centerY;
        }
        // Delete canvas
        this.context.clearRect(0, 0, this.canvas.width, this.canvas.height);
        // Redraw object
        this._drawExternal();
        this._drawInternal();
        // Set attribute of callback
        this.StickStatus.xPosition = this.movedX;
        this.StickStatus.yPosition = this.movedY;
        this.StickStatus.x = Number((100 * ((this.movedX - this.centerX) / this.maxMoveStick)).toFixed());
        this.StickStatus.y = Number((100 * ((this.movedY - this.centerY) / this.maxMoveStick) * -1).toFixed());
        this.StickStatus.cardinalDirection = this._getCardinalDirection();
        this.callback(this.StickStatus);
    }
    /**
     * @desc Events for manage mouse
     */
    _onMouseDown(event) {
        this.pressed = true;
    }
    /* To simplify this code there was a new experimental feature here: https://developer.mozilla.org/en-US/docs/Web/API/MouseEvent/offsetX , but it present only in Mouse case not metod presents in Touch case :-( */
    _onMouseMove(event) {
        if (this.pressed) {
            this.movedX = event.pageX;
            this.movedY = event.pageY;
            // Manage offset
            if (this.canvas.offsetParent.tagName.toUpperCase() === "BODY") {
                this.movedX -= this.canvas.offsetLeft;
                this.movedY -= this.canvas.offsetTop;
            }
            else {
                this.movedX -= this.canvas.offsetParent.offsetLeft;
                this.movedY -= this.canvas.offsetParent.offsetTop;
            }
            // Delete canvas
            this.context.clearRect(0, 0, this.canvas.width, this.canvas.height);
            // Redraw object
            this._drawExternal();
            this._drawInternal();
            // Set attribute of callback
            this.StickStatus.xPosition = this.movedX;
            this.StickStatus.yPosition = this.movedY;
            this.StickStatus.x = Number((100 * ((this.movedX - this.centerX) / this.maxMoveStick)).toFixed());
            this.StickStatus.y = Number((100 *
                ((this.movedY - this.centerY) / this.maxMoveStick) *
                -1).toFixed());
            this.StickStatus.cardinalDirection = this._getCardinalDirection();
            this.callback(this.StickStatus);
        }
    }
    _onMouseUp(event) {
        this.pressed = false;
        // If required reset position store variable
        if (this.autoReturnToCenter) {
            this.movedX = this.centerX;
            this.movedY = this.centerY;
        }
        // Delete canvas
        this.context.clearRect(0, 0, this.canvas.width, this.canvas.height);
        // Redraw object
        this._drawExternal();
        this._drawInternal();
        // Set attribute of callback
        this.StickStatus.xPosition = this.movedX;
        this.StickStatus.yPosition = this.movedY;
        this.StickStatus.x = Number((100 * ((this.movedX - this.centerX) / this.maxMoveStick)).toFixed());
        this.StickStatus.y = Number((100 * ((this.movedY - this.centerY) / this.maxMoveStick) * -1).toFixed());
        this.StickStatus.cardinalDirection = this._getCardinalDirection();
        this.callback(this.StickStatus);
    }
    _getCardinalDirection() {
        let result = "";
        let orizontal = this.movedX - this.centerX;
        let vertical = this.movedY - this.centerY;
        if (vertical >= this.directionVerticalLimitNeg &&
            vertical <= this.directionVerticalLimitPos) {
            result = "C";
        }
        if (vertical < this.directionVerticalLimitNeg) {
            result = "N";
        }
        if (vertical > this.directionVerticalLimitPos) {
            result = "S";
        }
        if (orizontal < this.directionHorizontalLimitNeg) {
            if (result === "C") {
                result = "W";
            }
            else {
                result += "W";
            }
        }
        if (orizontal > this.directionHorizontalLimitPos) {
            if (result === "C") {
                result = "E";
            }
            else {
                result += "E";
            }
        }
        return result;
    }
    /******************************************************
     * Public methods
     *****************************************************/
    /**
     * @desc The width of canvas
     * @return Number of pixel width
     */
    GetWidth() {
        return this.canvas.width;
    }
    /**
     * @desc The height of canvas
     * @return Number of pixel height
     */
    GetHeight() {
        return this.canvas.height;
    }
    /**
     * @desc The X position of the cursor relative to the canvas that contains it and to its dimensions
     * @return Number that indicate relative position
     */
    GetPosX() {
        return this.movedX;
    }
    /**
     * @desc The Y position of the cursor relative to the canvas that contains it and to its dimensions
     * @return Number that indicate relative position
     */
    GetPosY() {
        return this.movedY;
    }
    /**
     * @desc Normalizzed value of X move of stick
     * @return Integer from -100 to +100
     */
    GetX() {
        return (100 * ((this.movedX - this.centerX) / this.maxMoveStick)).toFixed();
    }
    /**
     * @desc Normalizzed value of Y move of stick
     * @return Integer from -100 to +100
     */
    GetY() {
        return (100 *
            ((this.movedY - this.centerY) / this.maxMoveStick) *
            -1).toFixed();
    }
    /**
     * @desc Get the direction of the cursor as a string that indicates the cardinal points where this is oriented
     * @return String of cardinal point N, NE, E, SE, S, SW, W, NW and C when it is placed in the center
     */
    GetDir() {
        return this._getCardinalDirection();
    }
}
//# sourceMappingURL=JoyClass.js.map