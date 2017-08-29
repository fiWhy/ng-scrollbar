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
        'hideScrollOnOut': '='
      },
      link: function (scope, element, attrs) {
        var mainElm, transculdedContainer, tools, thumb, thumbLine, track;
        var enableTouchEvent = function () {
          var touchEventWidth = scope.touchEventWidth || 768;
          return window.innerWidth <= touchEventWidth;
        };
        var hideScrollEnabled = function () {
          return scope.hideScrollOnOut && enableTouchEvent();
        };
        var calculateYOffset = function (offsetY) {
          return enableTouchEvent() ? -offsetY : offsetY;
        };
        var flags = { bottom: attrs.hasOwnProperty('bottom') };
        var win = angular.element($window);
        var hasAddEventListener = !!win[0].addEventListener;
        var hasRemoveEventListener = !!win[0].removeEventListener;
        // Elements
        var dragger = { top: 0 }, page = { top: 0 };
        // Styles
        var scrollboxStyle, draggerStyle, draggerLineStyle, pageStyle;
        var calcStyles = function () {
          scrollboxStyle = {
            position: 'relative',
            overflow: 'hidden',
            'max-width': '100%',
            height: '100%'
          };
          if (page.height) {
            scrollboxStyle.height = page.height + 'px';
          }
          draggerStyle = {
            position: 'absolute',
            height: dragger.height + 'px',
            top: dragger.top + 'px'
          };
          draggerLineStyle = {
            position: 'relative',
            'line-height': dragger.height + 'px'
          };
          pageStyle = {
            position: 'relative',
            top: page.top + 'px',
            overflow: 'hidden'
          };
        };
        var redraw = function () {
          thumb.css('top', dragger.top + 'px');
          var draggerOffset = dragger.top / page.height;
          page.top = -Math.round(page.scrollHeight * draggerOffset);
          transculdedContainer.css('top', page.top + 'px');
        };
        var trackClick = function (event) {
          var offsetY = event.hasOwnProperty('offsetY') ? event.offsetY : event.layerY;
          var newTop = Math.max(0, Math.min(parseInt(dragger.trackHeight, 10) - parseInt(dragger.height, 10), offsetY));
          dragger.top = newTop;
          redraw();
          event.stopPropagation();
        };
        var wheelHandler = function (event) {
          var wheelSpeed = 40;
          // Mousewheel speed normalization approach adopted from
          // http://stackoverflow.com/a/13650579/1427418
          var o = event, d = o.detail, w = o.wheelDelta, n = 225, n1 = n - 1;
          // Normalize delta
          d = d ? w && (f = w / d) ? d / f : -d / 1.35 : w / 120;
          // Quadratic scale if |d| > 1
          d = d < 1 ? d < -1 ? (-Math.pow(d, 2) - n1) / n : d : (Math.pow(d, 2) + n1) / n;
          // Delta *should* not be greater than 2...
          event.delta = Math.min(Math.max(d / 2, -1), 1);
          event.delta = event.delta * wheelSpeed;
          dragger.top = Math.max(0, Math.min(parseInt(page.height, 10) - parseInt(dragger.height, 10), parseInt(dragger.top, 10) - event.delta));
          redraw();
          if (!!event.preventDefault) {
            event.preventDefault();
          } else {
            return false;
          }
        };
        var lastOffsetY = 0;
        var thumbDrag = function (event, offsetX, offsetY) {
          dragger.top = Math.max(0, Math.min(parseInt(dragger.trackHeight, 10) - parseInt(dragger.height, 10), calculateYOffset(offsetY)));
          event.stopPropagation();
        };
        var dragHandler = function (event) {
          var newOffsetX = 0;
          var newOffsetY = event.pageY - thumb[0].scrollTop - lastOffsetY;
          thumbDrag(event, newOffsetX, newOffsetY);
          redraw();
        };
        var _mouseUp = function (event) {
          win.off('mousemove', dragHandler);
          win.off('mouseup', _mouseUp);
          event.stopPropagation();
        };
        var _touchDragHandler = function (event) {
          var newOffsetX = 0;
          var changedTouches = event.changedTouches ? event.changedTouches : event.originalEvent.changedTouches;
          var newOffsetY = changedTouches[0].pageY - parseInt(thumb.css('top') || 0) - lastOffsetY;
          thumbDrag(event, newOffsetX, newOffsetY);
          redraw();
        };
        var _touchEnd = function (event) {
          win.off('touchmove', _touchDragHandler);
          win.off('touchend', _touchEnd);
          event.stopPropagation();
        };
        var registerEvent = function (elm, eventName) {
          var event = eventName || 'mousewheel';
          if (hasAddEventListener) {
            elm.addEventListener(event, wheelHandler, false);
          } else {
            elm.attachEvent('on' + event, wheelHandler);
          }
        };
        var removeEvent = function (elm, eventName) {
          var event = eventName || 'mousewheel';
          if (hasRemoveEventListener) {
            elm.removeEventListener(event, wheelHandler, false);
          } else {
            elm.detachEvent('on' + event, wheelHandler);
          }
        };
        var buildScrollbar = function (rollToBottom) {
          rollToBottom = flags.bottom || rollToBottom;
          mainElm = angular.element(element.children()[0]);
          transculdedContainer = angular.element(mainElm.children()[0]);
          tools = angular.element(mainElm.children()[1]);
          thumb = angular.element(angular.element(tools.children()[0]).children()[0]);
          thumbLine = angular.element(thumb.children()[0]);
          track = angular.element(angular.element(tools.children()[0]).children()[1]);
          page.height = element[0].offsetHeight;
          page.scrollHeight = transculdedContainer[0].scrollHeight;
          var emitShow = function () {
            $timeout(function () {
              scope.showYScrollbar = true;
              scope.$emit('scrollbar.show');
            });
          };
          var emitHide = function (e) {
            $timeout(function () {
              scope.showYScrollbar = false;
              scope.$emit('scrollbar.hide');
            });
          };
          if (page.height < page.scrollHeight) {
            if (!hideScrollEnabled()) {
              emitShow();
            }
            // Calculate the dragger height
            dragger.height = Math.round(page.height / page.scrollHeight * page.height);
            dragger.trackHeight = page.height;
            // update the transcluded content style and clear the parent's
            calcStyles();
            element.css({ overflow: 'hidden' });
            mainElm.css(scrollboxStyle);
            transculdedContainer.css(pageStyle);
            thumb.css(draggerStyle);
            thumbLine.css(draggerLineStyle);
            // Bind scroll bar events
            track.bind('click', trackClick);
            // Handle mousewheel
            registerEvent(transculdedContainer[0]);
            // Drag the scroller with the mouse
            thumb.on('mousedown', function (event) {
              lastOffsetY = event.pageY - thumb[0].offsetTop;
              win.on('mouseup', _mouseUp);
              win.on('mousemove', dragHandler);
              event.preventDefault();
            });
            scope.showHideScroller = function (event, flag) {
              var method = !scope.hideScrollOnOut ? function () {
                } : flag ? emitShow : emitHide;
              method(event);
            };
            // Drag the scroller by touch
            var touchStartCallback = function (event) {
              var changedTouches = event.changedTouches ? event.changedTouches : event.originalEvent.changedTouches;
              lastOffsetY = changedTouches[0].pageY - thumb[0].offsetTop;
              win.on('touchend', _touchEnd);
              win.on('touchmove', _touchDragHandler);
              if (hideScrollEnabled()) {
                scope.showHideScroller(event, true);
              }
              event.preventDefault();
            };
            var touchEndCallback = function (event) {
              if (hideScrollEnabled()) {
                scope.showHideScroller(event, false);
              }
            };
            thumb.on('touchstart', touchStartCallback);
            transculdedContainer.on('touchstart', function (e) {
              touchStartCallback(e);
            });
            transculdedContainer.on('touchend', touchEndCallback);
            if (rollToBottom) {
              flags.bottom = false;
              dragger.top = parseInt(page.height, 10) - parseInt(dragger.height, 10);
            } else {
              dragger.top = Math.max(0, Math.min(parseInt(page.height, 10) - parseInt(dragger.height, 10), parseInt(dragger.top, 10)));
            }
            redraw();
          } else {
            emitHide();
            thumb.off('mousedown');
            removeEvent(transculdedContainer[0]);
            transculdedContainer.attr('style', 'position:relative;top:0');
            // little hack to remove other inline styles
            mainElm.css({ height: '100%' });
          }
        };
        var rebuildTimer;
        var rebuild = function (e, data) {
          /* jshint -W116 */
          if (rebuildTimer != null) {
            clearTimeout(rebuildTimer);
          }
          /* jshint +W116 */
          var rollToBottom = !!data && !!data.rollToBottom;
          rebuildTimer = setTimeout(function () {
            page.height = null;
            buildScrollbar(rollToBottom);
            if (!scope.$$phase) {
              scope.$digest();
            }
            // update parent for flag update
            if (!scope.$parent.$$phase) {
              scope.$parent.$digest();
            }
          }, 72);
        };
        buildScrollbar();
        if (!!attrs.rebuildOn) {
          attrs.rebuildOn.split(' ').forEach(function (eventName) {
            scope.$on(eventName, rebuild);
          });
        }
        if (attrs.hasOwnProperty('rebuildOnResize')) {
          win.on('resize', rebuild);
        }
      },
      template: '<div>' + '<div class="ngsb-wrap" ng-mouseenter="showHideScroller($event, true)" ng-mouseleave="showHideScroller($event, false)">' + '<div class="ngsb-container" ng-transclude></div>' + '<div class="ngsb-scrollbar" style="position: absolute; display: block;" ng-show="showYScrollbar">' + '<div class="ngsb-thumb-container">' + '<div class="ngsb-thumb-pos" oncontextmenu="return false;">' + '<div class="ngsb-thumb" ></div>' + '</div>' + '<div class="ngsb-track"></div>' + '</div>' + '</div>' + '</div>' + '</div>'
    };
  }
]);