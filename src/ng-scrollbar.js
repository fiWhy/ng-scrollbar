'use strict';

angular.module('ngScrollbar', []).directive('ngScrollbar', [
  '$parse',
  '$window',
  '$timeout',
  function ($parse, $window, $timeout) {
    return {
      restrict: 'A',
      replace: true,
      transclude: true,
      scope: {
        'showYScrollbar': '=?isBarShown',
        'touchEventWidth': '=',
        'hideScrollOnOut': '=',
        'hideTimeout': '=',
      },
      link: function (scope, element, attrs) {
        var raf = window.requestAnimationFrame || window.setImmediate || function (c) { return setTimeout(c, 0); };
        var documentBody = angular.element(document.body),
          scrollRatio;
        var container = element,
          wrapper = angular.element(element.children()[0]),
          content = angular.element(wrapper.children()[0]),
          bar = wrapper.next();

        var touchEndTimeout;

        function enableMobileDeeds() {
          return window.innerWidth <= (scope.touchEventWidth || 768);
        }

        function enableHideScroll() {
          return scope.hideScrollOnOut;
        }

        function notifyShow() {
          $timeout.cancel(touchEndTimeout);
          scope.showYScrollbar = true;
          scope.$digest();
          scope.$emit("scrollbar.show");
        }

        function notifyHide() {
          var hideTimeout = scope.hideTimeout || 1000;
          if (enableHideScroll()) {
            touchEndTimeout = $timeout(function () {
              scope.showYScrollbar = false;
              scope.$emit("scrollbar.hide");
            })
          }
        }

        // Mouse drag handler
        function dragDealer(el) {
          var lastPageY;

          el.on('mousedown', function (e) {
            lastPageY = e.pageY;
            el.addClass('ss-grabbed');
            documentBody.addClass('ss-grabbed');

            documentBody.on('mousemove', drag);
            documentBody.on('mouseup', stop);
            return false;
          });
          content.on("touchstart", function () {
            notifyShow();
          });

          content.on("touchend", function () {
            notifyHide();
          });

          content.on("mouseleave", function () {
            onMouseLeave();
          })

          function drag(e) {
            notifyShow();
            var delta = e.pageY - lastPageY;
            lastPageY = e.pageY;
            raf(function () {
              content[0].scrollTop += delta / scrollRatio;
            });
          }

          function stop() {
            el.removeClass('ss-grabbed');
            documentBody.removeClass('ss-grabbed');
            documentBody.off('mousemove', drag);
            documentBody.off('mouseup', stop);
          }
        }

        function onMouseEnter(e) {
          notifyShow();
          moveBar(e);
        }

        function onMouseLeave(e) {
          notifyHide();
        }

        // Constructor
        function initScrollBar(el) {
          $timeout(function () {
            dragDealer(bar);
            moveBar();

            content.on('scroll', moveBar);
            el.on('mouseenter', onMouseEnter);

            var css = window.getComputedStyle(el[0]);
            if (css['height'] === '0px' && css['max-height'] !== '0px') {
              el.css('height', css['max-height']);
            }
          })
        }

        function moveBar() {
          var totalHeight = content[0].scrollHeight,
            ownHeight = container[0].clientHeight;

          scrollRatio = ownHeight / totalHeight;
          if (ownHeight > 0) {
            raf(function () {
              // Hide scrollbar if no scrolling is possible
              if (scrollRatio >= 1) {
                bar.addClass('ss-hidden')
              } else {
                bar.removeClass('ss-hidden')
                var top = (content[0].scrollTop / totalHeight) * 100 + '%';
                bar.css({
                  height: (scrollRatio) * 100 + '%',
                  top: top,
                });
              }
            });
          }
        }

        initScrollBar(element);

      },
      template: '<div class="ss-container" ng-class="{\'show-scroll\': showYScrollbar}"> \
        <div class="ss-wrapper"> \
          <div class="ss-content" ng-transclude> \
          </div> \
        </div> \
        <div class="ss-scroll"></div> \
      </div>',
    };
  }
]);
