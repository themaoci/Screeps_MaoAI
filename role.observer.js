const movement = require("helper.movement");

module.exports = {
    name: "observer",
    parts: [MOVE],
    run: function(creep) {
        if(Memory.disableObserver) return
        movement.moveToRoom(creep, creep.memory.target);
    }
};

const profiler = require("screeps-profiler");
profiler.registerObject(module.exports, 'observer');
