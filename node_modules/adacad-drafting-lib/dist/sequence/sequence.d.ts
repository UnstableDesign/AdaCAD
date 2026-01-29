import { Cell, Drawdown } from "../draft/types";
export declare namespace Sequence {
    class OneD {
        private state;
        constructor(initSequence?: Array<number>);
        /**
    * adds a new value to the front of current sequence state
    * @param val can accept a number or boolean.
    */
        unshift(val: number | boolean): this;
        /**
         * pushes a new value to the current sequence state
         * @param val can accept a number or boolean.
         */
        push(val: number | boolean | null): this;
        pushMultiple(push_val: number | boolean, multiple: number): this;
        unshiftMultiple(push_val: number | boolean, multiple: number): this;
        /**
         * repeats or cuts the current sequence so that it is of length n.
         * @param n the length of the sequence
         */
        resize(n: number): OneD;
        /**
     * adds unset cells so that it is of length n.
     * @param n the length of the sequence
     */
        padTo(n: number): this | undefined;
        /**
         * inverts all of the values of the current state
         * @returns
         */
        invert(): this;
        /**
       * slices a portion of the sequence
       * @returns
       */
        slice(start: number, end: number): this;
        /**
         * clears the current state and pushes a new row into the state value
         * @param row
         * @returns
         */
        import(row: Array<Cell> | Array<number>): this;
        /**
       *  pushes a new row into the state value without clearing the state
       * @param row
       * @returns
       */
        pushRow(row: Array<Cell> | Array<number>): this;
        deleteAndDrawIn(val: number): this;
        /**
         * given a sequence as input. It makes sure the current state and the sequence submitted to the function are modified to be the same length. They are made the same length by appending unset values to the sequence.
         * @param seq
         * @returns
         */
        matchSize(seq: OneD): this;
        computeFilter(filter: string, seq: OneD): this;
        /**
         * shifts the sequence in the amount of val
         * @param val a positive or negative number that controls the direction of the shift
         * @returns
         */
        shift(val: number): this;
        /**
         * repeats the sequence val times returning a sequence of size val * original sequence
         * @param val the number of times you would like to repeat. 1 returns itself. 0 returns nothing
         * @returns
         */
        repeat(val: number): this | undefined;
        reverse(): this;
        /**
         * provides the value of the state at this given moment of computation.
         * @returns the sequence as a numeric array
         */
        val(): Array<number>;
        /**
         * gets the value at a specified position
         * @returns the value at this location, or -1 if the location was invalid
         */
        get(i: number): number;
        /**
     * gets the value at a specified position
     * @returns the value at this location, or -1 if the location was invalid
     */
        set(i: number, val: number | boolean): this;
        /**
         * returns the length of the given state
         * @returns a number 0 or above
         */
        length(): number;
    }
    class TwoD {
        private state;
        constructor(arr?: number[][]);
        deleteWeft(i: number): this;
        deleteWarp(j: number): this;
        /**
         * uses the current state to populate a new space, but only upon a certain set of warps and wefts.
         * @param weftsys - the weft system upon which to map this draft
         * @param warpsys - the warp system upon which to map this draft
         * @param weft_system_map - the pattern of weft systems along the wefts
         * @param warp_system_draft - the pattern of warp systems along the warps
         * @param ends - the number of ends required in the output structure (based on the lcm of input warps)
         * @param pics - the number of picks required in the output structure (based on the lcm of input wefts)
         */
        mapToSystems(weftsys: Array<number>, warpsys: Array<number>, weft_system_map: OneD, warp_system_map: OneD, ends: number, pics: number): this;
        /**
         * used to assign a structure to every weft system associated with a given warp system
         * @param warpsys
         * @param weft_system_map
         * @param warp_system_map
         * @returns
         */
        mapToWarpSystems(warpsys: Array<number>, weft_system_map: OneD, warp_system_map: OneD, ends: number, pics: number): this;
        /**
         * used to handle layers that are composed only of floats, this function writes this stored sequence accross all warp systems
         * @param weftsys
         * @param weft_system_map
         * @param warp_system_map
         * @returns
         */
        mapToWeftSystems(weftsys: Array<number>, weft_system_map: OneD, warp_system_map: OneD, ends: number, pics: number): this;
        /**
         * places the non unset values from seq atop any unset values in the current state. It will also make the two sequences compatable sizes by repeating their original values.
         * @param seq
         * @returns
         */
        overlay(seq: TwoD, consider_heddle_down_as_unset: boolean): this;
        /**
         * looks at the given weft. Sets any unset value in this weft to the value provided to the function
         * @param i
         * @param val
         */
        setUnsetOnWeft(i: number, val: number): this;
        /**
       * looks at the given warp. Sets any unset value in this warp to the value provided to the function
       * @param j
       * @param val
       */
        setUnsetOnWarp(j: number, val: number): this;
        /**
         * given a current warp and weft system, as well as a list of the weft and warp systems that have been assigned to layers "above" the current warp and weft system, this function will ensure that structures are assigned such that they fall just under the previous layers in the layer stack
         * @param cur_warp_sys  the current warp systems we are considering
         * @param warp_sys_above the warp systems that have been used in previous layers above this layer
         * @param cur_weft_sys  the current weft systems we are considering
         * @param weft_sys_above the weft systems that have been used in previous layers above this layer
         * @param weft_system_map a map of the weft systems used in this draft
         * @param warp_system_map a map of the warp systems used in this draft
         * @returns
         */
        placeInLayerStack(cur_warp_sys: Array<number>, warp_sys_above: Array<number>, cur_weft_sys: Array<number>, weft_sys_above: Array<number>, weft_system_map: OneD, warp_system_map: OneD): this;
        /**
         * this sets the value at a given location specified by i and j
         * This function will only succesfully set a value if the current value in that place is "unset", otherwise it returns an error that it is attempting to overwrite a value
         * @param i
         * @param j
         * @param val
         * @returns
         */
        set(i: number, j: number, val: number, can_overwrite_set: boolean): this;
        get(i: number, j: number): number;
        getWeft(i: number): Array<number>;
        getWarp(j: number): Array<number>;
        /**
         * adds a row to the first (or subsequent row) of the 2D sequence
         * @param seq the 1D sequence value to add
         * @returns
         */
        pushWarpSequence(seq: Array<number>): this;
        /**
       * adds this weft to the front of the pattern
       * @param seq the 1D sequence value to add
       * @returns
       */
        unshiftWarpSequence(seq: Array<number>): this;
        /**
       * adds a col to the first (or subsequent col) of the 2D sequence
       * @param seq the 1D sequence value to add
       * @returns
       */
        pushWeftSequence(seq: Array<number>): this;
        /**
         * adds this weft to the front of the pattern
         * @param seq the 1D sequence value to add
         * @returns
         */
        unshiftWeftSequence(seq: Array<number>): this;
        setBlank(val?: number | boolean): TwoD;
        wefts(): number;
        warps(): number;
        /**
         * fills a rectangle of given size with the current state. If the rectangle specified is smaller than state, it crops the current state
         * @param w the width
         * @param h the hieght
         */
        fill(w: number, h: number): TwoD;
        shiftRow(i: number, val: number): this;
        shiftCol(j: number, val: number): this;
        copy(): TwoD;
        /**
         * clears the current state (if any)
         * and creates a new 2D Sequence Object from a DD
         * @param dd
         */
        import(dd: Drawdown): this;
        /**
         * converts the current state to a drawdown format
         * @returns
         */
        export(): Drawdown;
    }
}
