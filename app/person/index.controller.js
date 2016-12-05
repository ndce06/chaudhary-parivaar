(function () {
    'use strict';

    angular
        .module('app')
        .controller('Person.IndexController', Controller)
        .controller('Person.Controller', personController);

    function Controller($window, UserService, PersonService, FlashService, $uibModal, $filter) {
        var vm = this;

        vm.user = null;
        vm.persons = null;
        vm.person = {};
        vm.totalItems = 0;
        vm.limit = 20;
        vm.currentPage = 1;
        vm.query = "";
        vm.pageChanged = function () {
            getAllPerson();
        };
        vm.getPagingInfo = function() {
            var start = ((vm.currentPage-1) * vm.limit) + 1;
            var end = (vm.currentPage * vm.limit > vm.totalItems) ? vm.totalItems : (vm.currentPage * vm.limit);
            return "Showing : "+start+" - "+end+" of " + vm.totalItems;
        };
        vm.refreshPage = function() {
            getAllPerson();
        };


        initController();

        function initController() {
            // get current user
            UserService.GetCurrent().then(function (user) {
                vm.user = user;
            });


            getAllPerson();
        }

        function getAllPerson() {
            PersonService.GetPersonList(vm.limit,vm.currentPage,vm.query)
                .then(function(obj){
                    vm.totalItems = obj.total;
                    vm.persons = obj.persons;
                })
                .catch(function (error) {
                    FlashService.Error(error);
                });
        }

        function openModal() {
            var modalInstance = $uibModal.open({
                templateUrl: 'person/person.html',
                controller: 'Person.Controller',
                controllerAs: 'vm',
                size: 'lg',
                resolve: {
                    person: function() {
                        return vm.person;
                    }
                }
            });

            modalInstance.result.then(function(isReload) {
                vm.person = {};
                if(isReload) {
                    getAllPerson();
                }
            }, function() {
            });

        }

        vm.deletePerson = function(p) {
            var name = (p.parentName && p.parentName !== "") ? p.name + " " + p.parentName : p.name;
            var modalInstance = $uibModal.open({
                template: '<div class="modal-body"><p>Are you sure to delete entry for - <b>' + name + '</b>?</p></div><div class="modal-footer"><button class="btn btn-primary" type="button" ng-click="vm.ok()">Yes</button><button class="btn btn-warning" type="button" ng-click="vm.cancel()">No</button></div>',
                controller: function($uibModalInstance){
                    var vm = this;
                    vm.ok = function() {
                        $uibModalInstance.close(true); 
                    };

                    vm.cancel = function() {
                        $uibModalInstance.dismiss('cancel');
                    };
                },
                size: 'lg',
                controllerAs: 'vm'
            });

            modalInstance.result.then(function(isDelete) {
                if(isDelete) {
                    PersonService.Delete(p._id)
                        .then(function(){
                            FlashService.Success('Person list updated');
                            getAllPerson();        
                        })
                        .catch(function (error) {
                            FlashService.Error(error);
                        });
                }
            }, function() {
            });
        }
        
        vm.updatedPerson = function(p) {
            vm.person = p;
            openModal();
        }

        vm.addPersonChildren = function(p) {
            vm.person = {parentId: p._id, parentName: p.name};
            openModal();
        }

    }

    function personController($uibModalInstance, PersonService, FlashService, person) {
        var vm = this;
        vm.person = person;
        vm.title = (vm.person.name && vm.person.name !== "") ? "Update" : "Add";

        vm.ok = function() {
            delete vm.person.parentName;
            if(vm.person._id && vm.person._id !== "") {
                // Update
                PersonService.Update(vm.person)
                .then(function(){
                    FlashService.Success('Person list updated');
                    $uibModalInstance.close(true);    
                })
                .catch(function (error) {
                    FlashService.Error(error);
                });

            } else {
                // Create
                PersonService.Create(vm.person)
                .then(function(){
                    FlashService.Success('Person list updated');
                    $uibModalInstance.close(true);    
                })
                .catch(function (error) {
                    FlashService.Error(error);
                });
            }
        };

        vm.cancel = function() {
            $uibModalInstance.dismiss('cancel');
        };



    }


})();