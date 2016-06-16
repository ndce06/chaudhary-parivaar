var config = require('config');
var _ = require('lodash');
var Q = require('q');
var mongo = require('mongoskin');
var db = mongo.db(config.connectionString, { native_parser: true });
db.bind('members');

var service = {};

service.getById = getById;
service.getAll = getAll;
service.create = create;
service.update = update;
service.delete = _delete;

module.exports = service;

function getById(_id) {
    var deferred = Q.defer();

    db.members.findById(_id, function (err, member) {
        if (err) deferred.reject(err);

        if (member) {
            deferred.resolve(member);
        } else {
            // member not found
            deferred.resolve();
        }
    });

    return deferred.promise;
}

function getAll(memberParam) {
    var deferred = Q.defer();

    db.members.find(memberParam).toArray(function (err, member) {
        if (err) deferred.reject(err);
        if(member) {
            deferred.resolve(member);
        } else {
            deferred.reject('Member not found');
        }
    });

    return deferred.promise;
}

function create(memberParam) {
    var deferred = Q.defer();

    // validation
    db.members.findOne(
        { parentId: memberParam.parentId, fName: memberParam.fName, lName: memberParam.lName  },
        function (err, member) {
            if (err) deferred.reject(err);

            if (member) {
                // member already exists
                deferred.reject('Member "' + memberParam.fName + ' ' + memberParam.lName + '" is already exists');
            } else {
                createMember();
            }
        });

    function createMember() {
        var member = memberParam;

        db.members.insert(
            member,
            function (err, doc) {
                if (err) deferred.reject(err);

                deferred.resolve();
            });
    }

    return deferred.promise;
}

function update(_id, memberParam) {
    var deferred = Q.defer();

    // validation
    db.members.findById(_id, function (err, member) {
        if (err) deferred.reject(err);

        updateMember();
    });

    function updateMember() {
        // fields to update
        var set = {
            parentId: memberParam.parentId,
            fName: memberParam.fName,
            lName: memberParam.lName,
            gender: memberParam.gender
        };

        db.members.update(
            { _id: mongo.helper.toObjectID(_id) },
            { $set: set },
            function (err, doc) {
                if (err) deferred.reject(err);

                deferred.resolve();
            });
    }

    return deferred.promise;
}

function _delete(_id) {
    var deferred = Q.defer();

    db.members.remove(
        { _id: mongo.helper.toObjectID(_id) },
        function (err) {
            if (err) deferred.reject(err);

            deferred.resolve();
        });

    return deferred.promise;
}
