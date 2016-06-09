(function () {
    'use strict';

    angular
        .module('app')
        .controller('Member.IndexController', Controller);

    function Controller(UserService, MemberService, FlashService) {
        var vm = this;

        vm.user = null;
        vm.members = null;
        vm.member = {
            fName: "",
            lName: "",
            gender: "",
            userId: "",
            parentId: ""
        };

        initController();

        function initController() {
            // get current user
            UserService.GetCurrent().then(function (user) {
                vm.user = user;

                // get member
                loadMembers();
            });

        }

        function loadMembers() {
            MemberService.GetAll({userId: vm.user._id}).then(function(members){
                vm.members = members;
            })
            .catch(function(error){
                FlashService.Error(error);
            });
        }

        vm.addMember = function() {
            vm.member.parentId = 0;
            vm.member.userId = vm.user._id;
            MemberService.Create(vm.member).then(function(members){
                FlashService.Success("Member added successfully!!");
                loadMembers();
                vm.clear();
            })
            .catch(function(error){
                FlashService.Error(error);
            });
        };

        vm.clear = function() {
            vm.member = {
                fName: "",
                lName: "",
                gender: "",
                userId: "",
                parentId: ""
            };
        };
    }

})();