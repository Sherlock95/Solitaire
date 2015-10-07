window.onload = function init()
{
    var canvas;
    var gl;

    var vPosition;
    var vColor;
    var program;
    var verticesBuffer;
    var perspectiveMatrix;

    canvas = document.getElementById( "gl-canvas" );

    var gl = initWebGL( canvas );

    if ( gl ) {
        gl.clearColor( 0.165, 0.714, 0.043, 1.0 );
        gl.enable( gl.DEPTH_TEST );
        gl.clear( gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT );
        gl.viewport( 0, 0, canvas.width, canvas.height );
    }

    initShaders();
    initBuffers();

    render();

    function render() 
    {
        gl.clear( gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT );

        perspectiveMatrix = makePerspective( 45, canvas.width/canvas.height, 0.1, 100.0 );

        loadIdentity();
        mvTranslate( [ -0.0, 0.0, -6.0 ] );

        gl.bindBuffer(gl.ARRAY_BUFFER, verticesBuffer);
        gl.vertexAttribPointer(vPosition, 3, gl.FLOAT, false, 0, 0);
        setMatrixUniforms();
        gl.drawArrays(gl.TRIANGLE_STRIP, 0, 4)
    }

    function initWebGL( canvas ) 
    {
        gl = null;

        gl = canvas.getContext( "webgl" );

        if ( !gl ) 
        {
            alert( "Unable to initialize webgl." );
        }

        return gl;
    }

    function initShaders()
    {
        var vertexShader = getShader( gl, "vertex-shader" );
        var fragmentShader = getShader( gl, "fragment-shader" );

        shaderProgram = gl.createProgram();
        gl.attachShader( shaderProgram, vertexShader );
        gl.attachShader( shaderProgram, fragmentShader );
        gl.linkProgram( shaderProgram );

        if ( !gl.getProgramParameter( shaderProgram, gl.LINK_STATUS ) )
        {
            alert( "Unable to initialize the shader program." );
        }

        gl.useProgram( shaderProgram );

        vPosition = gl.getAttribLocation( shaderProgram, "vPosition" );
        gl.enableVertexAttribArray( vPosition );
    }

    function initBuffers() {
        verticesBuffer = gl.createBuffer();
        gl.bindBuffer( gl.ARRAY_BUFFER, verticesBuffer );

        var vertices = [
            1.0, 1.0, 0.0,
            -1.0, 1.0, 0.0,
            1.0, -1.0, 0.0,
            -1.0, -1.0, 0.0 ];

        gl.bufferData( gl.ARRAY_BUFFER, new Float32Array( vertices ), gl.STATIC_DRAW );
    }

    function getShader( gl, id )
    {
        var shaderScript, theSource, currentChild, shader;

        shaderScript = document.getElementById( id );

        if ( !shaderScript )
        {
            return null;
        }

        theSource = "";
        currentChild = shaderScript.firstChild;

        while ( currentChild )
        {
            if ( currentChild.nodeType == currentChild.TEXT_NODE )
            {
                theSource += currentChild.textContent;
            }

            currentChild = currentChild.nextSibling;
        }

        if ( shaderScript.type == "x-shader/x-fragment" )
        {
            shader = gl.createShader( gl.FRAGMENT_SHADER );
        }
        else if ( shaderScript.type == "x-shader/x-vertex" )
        {
            shader = gl.createShader( gl.VERTEX_SHADER );
        }
        else
        {
            return null;
        }

        gl.shaderSource( shader, theSource );

        gl.compileShader( shader );

        if ( !gl.getShaderParameter( shader, gl.COMPILE_STATUS ) )
        {
            alert( "An error occurred while compiling shaders: " + gl.getShaderInfoLog( shader ) );
            return null;
        }

        return shader
    }

    function loadIdentity() {
        mvMatrix = Matrix.I(4);
    }

    function multMatrix(m) {
        mvMatrix = mvMatrix.x(m);
    }

    function mvTranslate(v) {
        multMatrix(Matrix.Translation($V([v[0], v[1], v[2]])).ensure4x4());
    }

    function setMatrixUniforms() {
        var pUniform = gl.getUniformLocation(shaderProgram, "uPMatrix");
        gl.uniformMatrix4fv(pUniform, false, new Float32Array(perspectiveMatrix.flatten()));

        var mvUniform = gl.getUniformLocation(shaderProgram, "uMVMatrix");
        gl.uniformMatrix4fv(mvUniform, false, new Float32Array(mvMatrix.flatten()));
    }
};
