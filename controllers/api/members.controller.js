var config = require('config.json');
var express = require('express');
var router = express.Router();
var memberService = require('services/member.service');

// routes
router.post('/register', registerMember);
router.post('/all', getAllMember);
router.put('/:_id', updateMember);
router.delete('/:_id', deleteMember);

module.exports = router;

function registerMember(req, res) {
    memberService.create(req.body)
        .then(function () {
            res.sendStatus(200);
        })
        .catch(function (err) {
            res.status(400).send(err);
        });
}

function getAllMember(req, res) {
    memberService.getAll(req.body)
        .then(function (member) {
            res.send(member);
        })
        .catch(function (err) {
            res.status(400).send(err);
        });
}

function updateMember(req, res) {
    var userId = req.user.sub;
    if (req.params.createdBy !== userId) {
        // can only update own member
        return res.status(401).send('You can only update your own member');
    }

    memberService.update(req.params._id, req.body)
        .then(function () {
            res.sendStatus(200);
        })
        .catch(function (err) {
            res.status(400).send(err);
        });
}

function deleteMember(req, res) {
    var userId = req.user.sub;
    if (req.params.createdBy !== userId) {
        // can only delete own member
        return res.status(401).send('You can only delete your own member');
    }

    memberService.delete(req.params._id)
        .then(function () {
            res.sendStatus(200);
        })
        .catch(function (err) {
            res.status(400).send(err);
        });
}