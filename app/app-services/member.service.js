(function () {
    'use strict';

    angular
        .module('app')
        .factory('MemberService', Service);

    function Service($http, $q) {
        var service = {};

        service.GetAll = GetAll;
        service.GetById = GetById;
        service.Create = Create;
        service.Update = Update;
        service.Delete = Delete;

        return service;

        function GetAll(params) {
            return $http.post('/api/members/all', params).then(handleSuccess, handleError);
        }

        function GetById(_id) {
            return $http.get('/api/members/' + _id).then(handleSuccess, handleError);
        }

        function Create(user) {
            return $http.post('/api/members/register', user).then(handleSuccess, handleError);
        }

        function Update(user) {
            return $http.put('/api/members/' + user._id, user).then(handleSuccess, handleError);
        }

        function Delete(_id) {
            return $http.delete('/api/members/' + _id).then(handleSuccess, handleError);
        }

        // private functions

        function handleSuccess(res) {
            return res.data;
        }

        function handleError(res) {
            return $q.reject(res.data);
        }
    }

})();
