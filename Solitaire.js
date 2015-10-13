// Author: Jarrett Locke
// Class: Computer Graphics
//
// Assignment: Create a simple game of solitaire using WebGL (AAAARRRRRGGHGHHHH)
//
// Process:
//      - Create gl object
//      - Initialize viewport, clear color, and program.
//      - Initialize vertex buffer and attribute.
//      - Initialize color buffer and attribute.
//      - do things.
//
// It's really sad when I can find more documentation on WebGL from MSDN
//      than the actual developers of WebGL. >:(
//
// NOTES:
//      WebGL, when rendering 2D, implements depth by saying that things drawn
//          later are 

var canvas;
var gl;

var vPosition;
var vColor;
var program;
var verticesBuffer;
var verticesColorBuffer;

var drag = false;
var selected = false;

var oldX, oldY;
var deltaX = 0;
var deltaY = 0;

var CARD_WIDTH = 0.2;
var CARD_HEIGHT = 0.5;
var offset = 0.1;

var stacks = [ [], [], [], [], [], [], [] ];
var stackStartPos = [];
var deck_position = vec2( -0.981, 0.981 );
var finish_stackS = [];
var finish_stackH = [];
var finish_stackC = [];
var finish_stackD = [];
var finish_stackPos = [];

var cardNumbers = [ "ace", "two", "three", "four", "five", "six", "seven", "eight", "nine", "ten", "jack", "queen", "king" ];
var cardSuites = ["spades", "hearts", "clubs", "diamonds" ];
var cardVertices = [];
var cardColors = [];
var cards = [];
var deck = [ 0,  1,  2,  3,  4,  5,  6,  7,  8,  9, 10, 11, 12, 
            13, 14, 15, 16, 17, 18, 19, 20, 21, 22, 23, 24, 25, 
            26, 27, 28, 29, 30, 31, 32, 33, 34, 35, 36, 37, 38, 
            39, 40, 41, 42, 43, 44, 45, 46, 47, 48, 49, 50, 51 ];
var selectedCards = [];
var selected_Pos;

var renderOrder = [];

var stack1 = [];
var stack2 = [];
var stack3 = [];
var stack4 = [];
var stack5 = [];
var stack6 = [];
var stack7 = [];

var stack1 = [];
var stack2 = [];
var stack3 = [];
var stack4 = [];
var stack5 = [];
var stack6 = [];
var stack7 = [];
var deck = [];
var selectable = [];

window.onload = function init()
{
    canvas = document.getElementById( "gl-canvas" );

    gl = WebGLUtils.setupWebGL( canvas );
    if ( !gl )
    {
        alert( "WebGL is not available." );
        return;
    }

    gl.viewport( 0, 0, canvas.width, canvas.height );
    gl.clearColor( 0.0, 0.75, 0.0, 1.0 );

    program = initShaders( gl, "vertex-shader", "fragment-shader" );
    gl.useProgram( program );

    verticesBuffer = gl.createBuffer();
    gl.bindBuffer( gl.ARRAY_BUFFER, verticesBuffer );
    gl.bufferData( gl.ARRAY_BUFFER, 8 * 312, gl.STATIC_DRAW );

    vPosition = gl.getAttribLocation( program, "vPosition" );
    gl.vertexAttribPointer( vPosition, 2, gl.FLOAT, false, 0, 0 );
    gl.enableVertexAttribArray( vPosition );

    verticesColorBuffer = gl.createBuffer();
    gl.bindBuffer( gl.ARRAY_BUFFER, verticesColorBuffer );
    gl.bufferData( gl.ARRAY_BUFFER, 16 * 312, gl.STATIC_DRAW );

    vColor = gl.getAttribLocation( program, "vColor" );
    gl.vertexAttribPointer( vColor, 2, gl.FLOAT, false, 0, 0 );
    gl.enableVertexAttribArray( vColor );
    
    canvas.addEventListener( "mousedown", mouseDown );
    canvas.addEventListener( "mouseup", mouseUp );
    canvas.addEventListener( "mousemove", mouseMove );

    initCards();

    setInterval( render, 15 );

//     Rendering by setting certain positions in the buffer to set values. DO THIS.
//            gl.bindBuffer( gl.ARRAY_BUFFER, verticesBuffer );
//            tmp1 = [
//                cardVertices[ i ],
//                vec2( cardVertices[ i ][ 0 ] + CARD_WIDTH, cardVertices[ i ][ 1 ] ),
//                vec2( cardVertices[ i ][ 0 ], cardVertices[ i ][ 1 ] - CARD_HEIGHT ),
//                vec2( cardVertices[ i ][ 0 ] + CARD_WIDTH, cardVertices[ i ][ 1 ] - CARD_HEIGHT ),
//                vec2( cardVertices[ i ][ 0 ], cardVertices[ i ][ 1 ] - CARD_HEIGHT ),
//                vec2( cardVertices[ i ][ 0 ] + CARD_WIDTH, cardVertices[ i ][ 1 ] )
//            ];
//            gl.bufferSubData( gl.ARRAY_BUFFER, 48 * i, flatten( tmp1 ) );

    function render()
    {
        gl.clear( gl.COLOR_BUFFER_BIT );
        gl.drawArrays( gl.TRIANGLES, 0, 312 );
    }

    function mouseDown( e )
    {
        drag = true;

        var mouseX = 2 * e.clientX / canvas.width - 1;
        var mouseY = 2 * ( canvas.height - e.clientY ) / canvas.height - 1;
    }

    function mouseUp( e )
    {
        drag = false;
    }

    function mouseMove( e )
    {
        if ( !drag )
        {
            return;
        }

        newX = 2 * e.clientX / canvas.width - 1;
        newY = 2 * ( canvas.height - e.clientY ) / canvas.height - 1;

        cardVertices[ stacks[ 2 ][ 4 ] ][ 0 ] = newX - ( CARD_WIDTH / 2 );
        cardVertices[ stacks[ 2 ][ 4 ] ][ 1 ] = newY + ( CARD_HEIGHT / 2 );
    }

    // Init cards. 
    // Generate a "deck" with the values 0 - 51 in random order.
    // "deal" the cards in specified places ( the rows );
    function initCards()
    {
        for ( var i = 0; i < 52; ++i )
        {
            cardVertices.push( vec2( -0.125, 0.25 ) );
        }

        cardColors.push( vec4( 1.0, 0.0, 0.0, 1.0 ) );
        cardColors.push( vec4( 1.0, 1.0, 1.0, 1.0 ) );
        cardColors.push( vec4( 0.0, 0.0, 1.0, 1.0 ) );

        // Initialize the starting positions for cards in the stacks
        for ( var i = 0; i < 7; ++i )
        {
            stackStartPos.push( vec2( -0.98 + ( 0.25 * i ), 0.41 ) );
        }

        // Shuffle the deck - Modern Fisher-Yates Shuffle Algorithm O( n )
        // https://en.wikipedia.org/wiki/Fisher%E2%80%93Yates_shuffle#The_modern_algorithm
        for ( var i = 51; i > 0; --i )
        {
            var index = Math.floor( Math.random() * i );
            var tmp = deck[ i ];
            deck[ i ] = deck[ index ];
            deck[ index ] = tmp;
        }
        
        // Deal out the cards.
        var track = 7;
        for ( var i = 0; i < 7; ++i )
        {
            for ( var j = 0; j < track; ++j )
            {
                stacks[ i ].push( deck.pop() );
            }
            --track;
        }

        // Record the position of the cards in the stacks.

        // Stack 1
        cardVertices[ stacks[ 6 ][ 0 ] ] = vec2( stackStartPos[ 0 ][ 0 ], stackStartPos[ 0 ][ 1 ] );

        // Stack 2
        for ( var i = 0; i < 2; ++i )
        {
            cardVertices[ stacks[ 5 ][ i ] ] = vec2( stackStartPos[ 1 ][ 0 ], stackStartPos[ 1 ][ 1 ] - ( offset * i ) );
        }

        // Stack 3
        for ( var i = 0; i < 3; ++i )
        {
            cardVertices[ stacks[ 4 ][ i ] ] = vec2( stackStartPos[ 2 ][ 0 ], stackStartPos[ 2 ][ 1 ] - ( offset * i ) );
        }

        // Stack 4
        for ( var i = 0; i < 4; ++i )
        {
            cardVertices[ stacks[ 3 ][ i ] ] = vec2( stackStartPos[ 3 ][ 0 ], stackStartPos[ 3 ][ 1 ] - ( offset * i ) );
        }

        // Stack 5
        for ( var i = 0; i < 5; ++i )
        {
            cardVertices[ stacks[ 2 ][ i ] ] = vec2( stackStartPos[ 4 ][ 0 ], stackStartPos[ 4 ][ 1 ] - ( offset * i ) );
        }

        // Stack 6
        for ( var i = 0; i < 6; ++i )
        {
            cardVertices[ stacks[ 1 ][ i ] ] = vec2( stackStartPos[ 5 ][ 0 ], stackStartPos[ 5 ][ 1 ] - ( offset * i ) );
        }

        // Stack 7
        for ( var i = 0; i < 7; ++i )
        {
            cardVertices[ stacks[ 0 ][ i ] ] = vec2( stackStartPos[ 6 ][ 0 ], stackStartPos[ 6 ][ 1 ] - ( offset * i ) );
        }

        // Record position of the deck.
        for ( var i = 0; i < deck.length; ++i )
        {
            cardVertices[ deck[ i ] ] = deck_position;
        }

        // Render order Deck < Stacks
        // Only need to render top card in deck.
        renderOrder.push( deck[ deck.length - 1 ] );

        for ( var i = 0; i < 7; ++i )
        {
            renderOrder.push( stacks[ i ][ 0 ] );
        }

        for ( var i = 0; i < 6; ++i )
        {
            renderOrder.push( stacks[ i ][ 1 ] );
        }

        for ( var i = 0; i < 5; ++i )
        {
            renderOrder.push( stacks[ i ][ 2 ] );
        }

        for ( var i = 0; i < 4; ++i )
        {
            renderOrder.push( stacks[ i ][ 3 ] );
        }

        for ( var i = 0; i < 3; ++i )
        {
            renderOrder.push( stacks[ i ][ 4 ] );
        }

        for ( var i = 0; i < 2; ++i )
        {
            renderOrder.push( stacks[ i ][ 5 ] );
        }

        renderOrder.push( stacks[ 0 ][ 6 ] );

        // Push card positions to vertex shader buffer.
        for ( var i = 0; i < renderOrder.length; ++i )
        {
            var index = renderOrder[ i ];
            gl.bindBuffer( gl.ARRAY_BUFFER, verticesBuffer );
            var tmp = [
                cardVertices[ index ],
                vec2( cardVertices[ index ][ 0 ] + CARD_WIDTH, cardVertices[ index ][ 1 ] ),
                vec2( cardVertices[ index ][ 0 ], cardVertices[ index ][ 1 ] - CARD_HEIGHT ),
                vec2( cardVertices[ index ][ 0 ] + CARD_WIDTH, cardVertices[ index ][ 1 ] - CARD_HEIGHT ),
                vec2( cardVertices[ index ][ 0 ], cardVertices[ index ][ 1 ] - CARD_HEIGHT ),
                vec2( cardVertices[ index ][ 0 ] + CARD_WIDTH, cardVertices[ index ][ 1 ] )
            ];
            gl.bufferSubData( gl.ARRAY_BUFFER, 48 * i, flatten( tmp ) );
        }

        for ( var i = 0; i < renderOrder.length; ++i )
        {
            var index = renderOrder[ i ];
            gl.bindBuffer( gl.ARRAY_BUFFER, verticesColorBuffer );
            var tmp = [
                vec4( 1.0, 0.0, 0.0, 1.0 ),
                vec4( 1.0, 0.0, 0.0, 1.0 ),
                vec4( 1.0, 0.0, 0.0, 1.0 ),
                vec4( 1.0, 0.0, 0.0, 1.0 ),
                vec4( 1.0, 0.0, 0.0, 1.0 ),
                vec4( 1.0, 0.0, 0.0, 1.0 )
            ];
            gl.bufferSubData( gl.ARRAY_BUFFER, 96 * i, flatten( tmp ) );
        }
    }
};
