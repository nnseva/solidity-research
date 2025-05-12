// SPDX-License-Identifier: MIT
// Copyright (C) 2023 nnseva
// This file is part of the Micro-Solidity investigation project

// This investigation uses shortened address space
// and shortened keccak hash function
// The code is not intended to be used in production
// and is for educational purposes only

// Micro-Solidity VM investigation
var investigate = function(width, slot_bits, mapkey_bits, shift, fill_arrays) {
    // width [K] = Number of bits in the address space
    // slot_bits [S] = Slots index bits
    // mapkey_bits [M] = Mapping key bits
    // shift = we use different shift values to approve that the hash does not
    // depend on the bits selection in the shortened hash function

    const kecc = function(data) {
        // Hash the data and return the hash
        // as a BigInt
        var hash = BigInt(ethers.keccak256(data));
        return (hash >> BigInt(shift)) % (2n ** BigInt(width));
    }
    this.kecc = kecc;

    const arrayof = function(slot) {
        // Returns the dynamic array area starting address
        // basing on the slot
        slot = BigInt(slot);
        return kecc(ethers.toBeHex(slot, Math.ceil(width / 8)));
    }
    this.arrayof = arrayof;

    const mappingof = function(key, slot) {
        // Returns the mapping member area starting address
        // basing on the slot and the key
        key = BigInt(key);
        slot = BigInt(slot);
        // The slot is used as a lower part of the hash source
        // The key is used as a higher part of the hash source
        // The hash source has the widht twice of the address space
        // aligned to the 8-bit byte
        // The hash is calculated as a shortened keccak hash
        // of the slot and the key as in the original Solidity
        return kecc(ethers.toBeHex(slot + 2n ** BigInt(width) * key, Math.ceil(width / 4)));
    };
    this.mappingof = mappingof;

    this.analize = function() {
        var conflicts = [];
        var used_slots = [];
        // Fill the slots used by static data
        used_slots.push({
            address: 2n**BigInt(slot_bits),
            kind: 's',
        });
        // Fill the slots used by arrays
        if(fill_arrays) {
            console.log(`Filling the slots used by arrays`);
            for(var i=0n; i < 2n ** BigInt(slot_bits); i++) {
                var address = arrayof(i);
                used_slots.push({
                    address: address,
                    slot: i,
                    kind: 'a'
                });
            }
        }
        // Fill the slots used by mappings
        console.log(`Filling the slots used by mappings`);
        for(var i=0n; i < 2n ** BigInt(slot_bits); i++) {
            for(var j=0; j < 2n ** BigInt(mapkey_bits); j++) {
                var address = mappingof(j, i);
                used_slots.push({
                    address: address,
                    slot: i,
                    key: j,
                    kind: 'm'
                });
            }
        }
        // Sort the used slots by address
        used_slots.sort((a, b) => (a.address < b.address ? -1 : a.address == b.address ? 0 : 1));
        // Check for conflicts
        for(var i=0; i < used_slots.length - 1; i++) {
            if(used_slots[i].address == used_slots[i+1].address) {
                conflicts.push({
                    address: used_slots[i].address,
                    slot1: used_slots[i],
                    slot2: used_slots[i+1],
                });
            }
        }
        if(conflicts.length > 0) {
            console.log(`Found ${conflicts.length} conflicts`);
            return conflicts;
        }
        // calculate the space between the used slots
        for(var i=0; i < used_slots.length - 1; i++) {
            used_slots[i].max = used_slots[i+1].address - used_slots[i].address;
            used_slots[i].next = used_slots[i+1].address;
        }
        used_slots[i].max = 2n ** BigInt(width) - used_slots[i].address;
        used_slots[i].next = 'end';
        used_slots.sort((a, b) => (a.max < b.max ? -1 : a.max == b.max ? 0 : 1));
        return {
            min:used_slots[0].max, min_next:used_slots[0].next,
            max:used_slots[used_slots.length - 1].max,
        }
    }
}

export { investigate };
