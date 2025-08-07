import './module.js';

import templateHTML from './templates/savemanager.html';

angular.module('anol.savesettings')

    .directive('anolSavesettings', ['$templateRequest', '$compile', 'SaveSettingsService', 'ProjectSettings', 'NotificationService',
        function ($templateRequest, $compile, SaveSettingsService, ProjectSettings, NotificationService) {
            return {
                restrict: 'A',
                template: function (tElement, tAttrs) {
                    if (tAttrs.templateUrl) {
                        return '<div></div>';
                    }
                    return templateHTML;
                },
                scope: {
                    modalCallBack: '&'
                },
                link: function (scope, element, attrs) {

                    if (attrs.templateUrl && attrs.templateUrl !== '') {
                        $templateRequest(attrs.templateUrl).then(function (html) {
                            const template = angular.element(html);
                            element.html(template);
                            $compile(template)(scope);
                        });
                    }

                    const pageBody = angular.element(document).find('body');
                    scope.addWaiting = function () {
                        pageBody.addClass('waiting');
                    };
                    scope.removeWaiting = function () {
                        pageBody.removeClass('waiting');
                    };

                    scope.projectSettings = ProjectSettings;
                    scope.close = function () {
                        scope.modalCallBack();
                    };
                    scope.delete = function (id) {
                        scope.addWaiting();
                        SaveSettingsService.delete(id).then(function (data) {
                            NotificationService.addInfo(data.message);
                            scope.removeWaiting();
                        }, function (data) {
                            NotificationService.addError(data.message);
                            scope.removeWaiting();
                        });
                    };
                    scope.save = function (name) {
                        // load project name to overwrite
                        if (angular.isUndefined(name) || scope.id) {
                            angular.forEach(scope.projectSettings, function (value) {
                                if (value.id === parseInt(scope.id)) {
                                    name = value.name;
                                }
                            });
                        }
                        if (angular.isUndefined(name) || name === '') {
                            return;
                        }
                        scope.addWaiting();
                        SaveSettingsService.save(name).then(function (data) {
                            scope.modalCallBack();
                            NotificationService.addInfo(data.message);
                            scope.removeWaiting();
                        }, function (data) {
                            NotificationService.addError(data.message);
                            scope.removeWaiting();
                        });
                    };
                    scope.load = function (id) {
                        if (angular.isUndefined(id)) {
                            return;
                        }
                        scope.addWaiting();
                        SaveSettingsService.load(id).then(function (data) {
                            scope.modalCallBack();
                            NotificationService.addInfo(data.message);
                            setTimeout(function () {
                                scope.removeWaiting();
                            }, 250);
                        }, function (data) {
                            NotificationService.addError(data.message);
                            scope.removeWaiting();
                        });
                    };
                }
            };
        }]);
