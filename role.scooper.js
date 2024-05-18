const parkStructures = [STRUCTURE_STORAGE, STRUCTURE_POWER_BANK, STRUCTURE_CONTAINER, STRUCTURE_TERMINAL, STRUCTURE_EXTENSION, STRUCTURE_SPAWN];

module.exports = {
    name: "scooper",
    configs:  function(capacity) {
        var configs = [];
        for(var carries = Math.ceil(capacity / CARRY_CAPACITY); carries >= 2; carries -= 1) {
            let config = Array(carries).fill(CARRY).concat(Array(carries).fill(MOVE));
            if(config.length <= 50) configs.push(config);
        }

        return configs;
    },
    run: function(creep) {
        //console.log(JSON.stringify(creep,0,2))
        if(creep.memory.returningHome || (creep.ticksToLive <= 200 && creep.store.energy > 0)) {
            this.returnHome(creep);
        } else {
            if(creep.room.name !== creep.memory.target) {
                let target = { pos: new RoomPosition(25, 25, creep.memory.target) };
                creep.goTo(target, { avoidHostiles: true });
            } else {
                this.scoopRoom(creep);
            }
        }
    },
    returnHome: function(creep) {
        let home = Game.rooms[creep.memory.storageRoom];
        //home.storage = Memory.rooms[creep.memory.home].constructions.storage
        //console.log(JSON.stringify(home, null, 4))

        let target = home && home.storage;
        //console.log("scrapper to home! "  + JSON.stringify(target))
        if(!target){
            target = creep.pos.findClosestByPath(FIND_STRUCTURES, {
                filter: (s) => parkStructures.includes(s.structureType)
                            && s.store[RESOURCE_ENERGY] > 0
            });
            if(creep.pos.isNearTo(target)) {
                creep.memory.stopped = true;
                let resource = _.findKey(creep.store, (amount) => amount > 0);
                creep.transfer(target, resource);
                creep.memory.returningHome = false;
            } else {
                creep.memory.stopped = false;
                creep.goTo(target, { ignoreRoads: true, avoidHostiles: true });
            }
            //now we need to find empty container and go to it if he are full
            return;
        }
        //console.log("scrapper target ok!")
        if(creep.pos.isNearTo(target)) {
            //console.log("scrapper is near ! " + JSON.stringify(target))
            creep.memory.stopped = true;
            let resource = _.findKey(creep.store, (amount) => amount > 0);
            if(resource) {
                creep.transfer(target, resource);
            } else {
                creep.memory.returningHome = false;
            }
        } else {
            //console.log("scrapper is not near ! " + JSON.stringify(target))
            creep.memory.stopped = false;
            creep.goTo(target, { ignoreRoads: true, avoidHostiles: true });
        }
    },
    scoopRoom: function(creep) {
        if(creep.store.getFreeCapacity() == 0) {
            creep.memory.returningHome = true;
            return;
        }

        let target = creep.pos.findClosestByRange(FIND_DROPPED_RESOURCES);
        if(!target) target = creep.pos.findClosestByRange(FIND_TOMBSTONES, { filter: (t) => _.sum(t.store) > 0 });
        if(!target) target = creep.pos.findClosestByRange(FIND_RUINS, { filter: (t) => _.sum(t.store) > 0 });
        
        if(!target && (!creep.room.controller || (creep.room.controller && !creep.room.controller.my))) {
            target = creep.pos.findClosestByRange(FIND_STRUCTURES, { filter: (s) => {
                //console.log(`${s.structureType} -- ${parkStructures.includes(s.structureType)} -- ${_.sum(s.store)}`)
                return parkStructures.includes(s.structureType) && _.sum(s.store) > 0 }
            });
            //console.log(JSON.stringify(target,null,2))
        }

        if(!target) {
            if(_.sum(creep.store) > 0) {
                creep.memory.returningHome = true;
            } else {
                // Wait at a parking position.
                target = creep.pos.findClosestByRange(FIND_STRUCTURES,
                    { filter: (s) => parkStructures.includes(s.structureType) });
                if(!target) target = { pos: creep.room.getPositionAt(25, 25) };
                if(creep.pos.getRangeTo(target) <= 5) {
                    creep.memory.stopped = true;
                } else {
                    creep.memory.stopped = false;
                    creep.goTo(target, { range: 5, ignoreRoads: true, avoidHostiles: true });
                }
            }

            return;
        }

        let result = null;
        if(target.store) {
            result = creep.withdraw(target, _.last(Object.keys(target.store)));
        } else {
            result = creep.pickup(target);
        }

        if(result === ERR_NOT_IN_RANGE) {
            creep.memory.stopped = false;
            creep.goTo(target, { ignoreRoads: true, avoidHostiles: true });
        }
    }
};

const profiler = require("screeps-profiler");
profiler.registerObject(module.exports, 'scooper');
